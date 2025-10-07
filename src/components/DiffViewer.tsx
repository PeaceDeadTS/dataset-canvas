import React from 'react';

interface DiffViewerProps {
  oldText: string;
  newText: string;
}

interface DiffPart {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

/**
 * Простой алгоритм для вычисления diff между двумя строками
 * Использует алгоритм на основе Myers' diff algorithm (упрощенная версия)
 */
const computeDiff = (oldText: string, newText: string): DiffPart[] => {
  const oldWords = oldText.split(/(\s+)/); // Сохраняем пробелы
  const newWords = newText.split(/(\s+)/);
  
  const result: DiffPart[] = [];
  
  // Простая реализация diff на уровне слов
  let i = 0;
  let j = 0;
  
  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      // Остались только новые слова
      result.push({ type: 'added', value: newWords[j] });
      j++;
    } else if (j >= newWords.length) {
      // Остались только старые слова
      result.push({ type: 'removed', value: oldWords[i] });
      i++;
    } else if (oldWords[i] === newWords[j]) {
      // Слова совпадают
      result.push({ type: 'unchanged', value: oldWords[i] });
      i++;
      j++;
    } else {
      // Слова различаются - проверяем, может быть это замена или вставка/удаление
      const oldWordIndex = newWords.indexOf(oldWords[i], j);
      const newWordIndex = oldWords.indexOf(newWords[j], i);
      
      if (oldWordIndex !== -1 && (newWordIndex === -1 || oldWordIndex - j < newWordIndex - i)) {
        // Слово из old найдено в new позже - значит были добавления
        result.push({ type: 'added', value: newWords[j] });
        j++;
      } else if (newWordIndex !== -1) {
        // Слово из new найдено в old позже - значит были удаления
        result.push({ type: 'removed', value: oldWords[i] });
        i++;
      } else {
        // Слова не найдены дальше - это замена
        result.push({ type: 'removed', value: oldWords[i] });
        result.push({ type: 'added', value: newWords[j] });
        i++;
        j++;
      }
    }
  }
  
  return result;
};

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldText, newText }) => {
  const diff = computeDiff(oldText, newText);
  
  return (
    <div className="space-y-4">
      {/* Старая версия */}
      <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-950/20">
        <div className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          Было
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {diff.map((part, index) => {
            if (part.type === 'removed') {
              return (
                <span
                  key={index}
                  className="bg-red-200 dark:bg-red-900/50 text-red-900 dark:text-red-200 px-0.5 rounded line-through"
                >
                  {part.value}
                </span>
              );
            }
            if (part.type === 'unchanged') {
              return (
                <span key={index} className="text-muted-foreground">
                  {part.value}
                </span>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Новая версия */}
      <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-950/20">
        <div className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          Стало
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {diff.map((part, index) => {
            if (part.type === 'added') {
              return (
                <span
                  key={index}
                  className="bg-green-200 dark:bg-green-900/50 text-green-900 dark:text-green-200 px-0.5 rounded font-medium"
                >
                  {part.value}
                </span>
              );
            }
            if (part.type === 'unchanged') {
              return (
                <span key={index} className="text-muted-foreground">
                  {part.value}
                </span>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Статистика изменений */}
      <div className="text-xs text-muted-foreground flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          +{diff.filter(p => p.type === 'added').reduce((acc, p) => acc + p.value.length, 0)} символов
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
          -{diff.filter(p => p.type === 'removed').reduce((acc, p) => acc + p.value.length, 0)} символов
        </span>
      </div>
    </div>
  );
};

