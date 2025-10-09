import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Извлекает все изображения из Markdown текста
 * @param markdown - Markdown текст
 * @returns Массив объектов с alt текстом и URL изображения
 */
export function extractMarkdownImages(markdown: string): Array<{ alt: string; url: string }> {
  if (!markdown) return [];
  
  // Регулярное выражение для поиска изображений в формате ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: Array<{ alt: string; url: string }> = [];
  
  let match;
  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push({
      alt: match[1] || '',
      url: match[2]
    });
  }
  
  return images;
}

/**
 * Извлекает первый абзац текста из Markdown, удаляя всю разметку
 * @param markdown - Markdown текст
 * @param maxLength - Максимальная длина текста (по умолчанию 200)
 * @returns Чистый текст первого абзаца
 */
export function extractFirstParagraph(markdown: string, maxLength: number = 200): string {
  if (!markdown) return '';
  
  // Удаляем изображения
  let text = markdown.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '');
  
  // Удаляем ссылки, оставляя только текст ссылки
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Удаляем заголовки (# символы в начале строк)
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Удаляем жирный и курсив
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
  text = text.replace(/(\*|_)(.*?)\1/g, '$2');
  
  // Удаляем зачеркнутый текст
  text = text.replace(/~~(.*?)~~/g, '$1');
  
  // Удаляем inline код
  text = text.replace(/`([^`]+)`/g, '$1');
  
  // Удаляем блоки кода
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // Удаляем цитаты (> в начале строк)
  text = text.replace(/^>\s+/gm, '');
  
  // Удаляем горизонтальные линии
  text = text.replace(/^---+$/gm, '');
  text = text.replace(/^\*\*\*+$/gm, '');
  
  // Удаляем списки (-, *, +, 1. в начале строк)
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  
  // Разбиваем на абзацы
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) return '';
  
  // Берем первый абзац и убираем лишние пробелы
  let firstParagraph = paragraphs[0].trim().replace(/\s+/g, ' ');
  
  // Обрезаем до максимальной длины, если нужно
  if (firstParagraph.length > maxLength) {
    firstParagraph = firstParagraph.substring(0, maxLength).trim() + '...';
  }
  
  return firstParagraph;
}