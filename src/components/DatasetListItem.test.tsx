import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { DatasetListItem, Dataset } from './DatasetListItem';

describe('DatasetListItem', () => {
  const mockDataset: Dataset = {
    id: '1',
    name: 'Test Dataset Name',
    description: 'This is a test description.',
    isPublic: true,
    user: {
      id: 'u1',
      username: 'testuser',
    },
    createdAt: new Date().toISOString(),
    imageCount: 42,
  };

  it('renders dataset information correctly', () => {
    // Arrange
    render(
      <BrowserRouter>
        <DatasetListItem dataset={mockDataset} />
      </BrowserRouter>
    );

    // Act & Assert
    // Check if the name is displayed
    expect(screen.getByText(mockDataset.name)).toBeInTheDocument();

    // Check if the description is displayed
    expect(screen.getByText(mockDataset.description!)).toBeInTheDocument();

    // Check if the username is displayed
    expect(screen.getByText(`by ${mockDataset.user.username}`)).toBeInTheDocument();

    // Check if the image count is displayed
    expect(screen.getByText(`${mockDataset.imageCount} items`)).toBeInTheDocument();
  });

  it('creates a correct link to the dataset page', () => {
    // Arrange
    render(
      <BrowserRouter>
        <DatasetListItem dataset={mockDataset} />
      </BrowserRouter>
    );

    // Act
    const linkElement = screen.getByRole('link');

    // Assert
    expect(linkElement).toHaveAttribute('href', `/datasets/${mockDataset.id}`);
  });
});
