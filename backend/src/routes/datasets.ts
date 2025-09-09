import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Dataset } from '../entity/Dataset';
import { User, UserRole } from '../entity/User';
import { checkJwt, checkJwtOptional } from '../middleware/checkJwt';
import { Brackets } from 'typeorm';

const router = Router();

// Create a new dataset
router.post('/', [checkJwt], async (req, res) => {
    const { name, description, isPublic } = req.body;
    const { userId, role } = res.locals.jwtPayload;

    if (role !== UserRole.ADMIN && role !== UserRole.DEVELOPER) {
        return res.status(403).send('Forbidden');
    }

    if (!name) {
        return res.status(400).send('Dataset name is required');
    }

    const userRepository = getRepository(User);
    const datasetRepository = getRepository(Dataset);

    try {
        const owner = await userRepository.findOneOrFail(userId);

        const dataset = new Dataset();
        dataset.name = name;
        dataset.description = description;
        dataset.isPublic = isPublic ?? true;
        dataset.owner = owner;

        await datasetRepository.save(dataset);

        res.status(201).json(dataset);
    } catch (error) {
        res.status(500).send('Error creating dataset');
    }
});

// Get all datasets
router.get('/', [checkJwtOptional], async (req, res) => {
    const { userId, role } = res.locals.jwtPayload || {};
    const datasetRepository = getRepository(Dataset);

    try {
        const query = datasetRepository.createQueryBuilder('dataset')
            .leftJoinAndSelect('dataset.owner', 'owner')
            .where('dataset.isPublic = :isPublic', { isPublic: true });

        if (userId) {
            if (role === UserRole.ADMIN) {
                // Admin sees all datasets, so we remove the public constraint
                query.where('1=1');
            } else {
                query.orWhere(
                    new Brackets(qb => {
                        qb.where('dataset.isPublic = :isPrivate', { isPrivate: false })
                          .andWhere('dataset.owner.id = :userId', { userId });
                    })
                );
            }
        }

        const datasets = await query.getMany();
        res.json(datasets);
    } catch (error) {
        res.status(500).send('Error fetching datasets');
    }
});

// Get a single dataset
router.get('/:id', [checkJwtOptional], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = res.locals.jwtPayload || {};
    const datasetRepository = getRepository(Dataset);

    try {
        const dataset = await datasetRepository.findOne(id);

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (!dataset.isPublic) {
            if (!userId || (role !== UserRole.ADMIN && dataset.owner.id !== userId)) {
                return res.status(403).send('Forbidden');
            }
        }

        res.json(dataset);
    } catch (error) {
        res.status(500).send('Error fetching dataset');
    }
});

// Update a dataset
router.put('/:id', [checkJwt], async (req, res) => {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;
    const { userId, role } = res.locals.jwtPayload;
    const datasetRepository = getRepository(Dataset);

    try {
        const dataset = await datasetRepository.findOne(id);

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (role !== UserRole.ADMIN && dataset.owner.id !== userId) {
            // Developers can only edit their own datasets
            if (role === UserRole.DEVELOPER && dataset.owner.id !== userId) {
                return res.status(403).send('Forbidden: Developers can only edit their own datasets');
            }
            // Other roles are implicitly forbidden if they are not the owner or an admin
            if (role !== UserRole.DEVELOPER) {
                 return res.status(403).send('Forbidden');
            }
        }

        dataset.name = name ?? dataset.name;
        dataset.description = description ?? dataset.description;
        dataset.isPublic = isPublic ?? dataset.isPublic;

        await datasetRepository.save(dataset);
        res.json(dataset);
    } catch (error) {
        res.status(500).send('Error updating dataset');
    }
});

// Delete a dataset
router.delete('/:id', [checkJwt], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = res.locals.jwtPayload;
    const datasetRepository = getRepository(Dataset);

    try {
        const dataset = await datasetRepository.findOne(id);

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (role !== UserRole.ADMIN && dataset.owner.id !== userId) {
             if (role === UserRole.DEVELOPER && dataset.owner.id !== userId) {
                return res.status(403).send('Forbidden: Developers can only delete their own datasets');
            }
             if (role !== UserRole.DEVELOPER) {
                 return res.status(403).send('Forbidden');
            }
        }

        await datasetRepository.remove(dataset);
        res.status(204).send();
    } catch (error) {
        res.status(500).send('Error deleting dataset');
    }
});

export default router;
