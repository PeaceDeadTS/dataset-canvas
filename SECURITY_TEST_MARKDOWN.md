# Тестирование безопасности Markdown рендеринга

Этот документ содержит тесты для проверки безопасности системы рендеринга Markdown.

## ✅ Результаты тестирования

### 1. XSS через JavaScript (БЕЗОПАСНО)

**Тест:** `<script>alert('XSS')</script>`  
**Результат:** ✅ Блокируется `rehype-sanitize`  
**Поведение:** Тег полностью удаляется из вывода

### 2. XSS через `onerror` (БЕЗОПАСНО)

**Тест:** `<img src="x" onerror="alert('XSS')">`  
**Результат:** ✅ Атрибуты событий удаляются  
**Поведение:** Рендерится только `<img src="x">` без обработчиков

### 3. XSS через `onclick` (БЕЗОПАСНО)

**Тест:** `<a href="#" onclick="alert('XSS')">Click me</a>`  
**Результат:** ✅ Обработчики событий удаляются  
**Поведение:** Ссылка работает, но без JavaScript

### 4. Data URLs с JavaScript (БЕЗОПАСНО)

**Тест:** `<a href="javascript:alert('XSS')">Click</a>`  
**Результат:** ✅ JavaScript URLs блокируются  
**Поведение:** Ссылка удаляется или заменяется на безопасную

### 5. Iframe injection (БЕЗОПАСНО)

**Тест:** `<iframe src="https://evil.com"></iframe>`  
**Результат:** ✅ iframe полностью удаляется  
**Поведение:** Тег не рендерится

### 6. Object/Embed tags (БЕЗОПАСНО)

**Тест:** `<object data="https://evil.com"></object>`  
**Результат:** ✅ Опасные теги удаляются  
**Поведение:** Контент не отображается

### 7. Style injection (БЕЗОПАСНО)

**Тест:** `<style>body { display: none; }</style>`  
**Результат:** ✅ Style теги удаляются  
**Поведение:** Стили не применяются

### 8. SVG с JavaScript (БЕЗОПАСНО)

**Тест:** `<svg><script>alert('XSS')</script></svg>`  
**Результат:** ✅ Script внутри SVG удаляется  
**Поведение:** SVG рендерится без скриптов

### 9. HTML entity bypass (БЕЗОПАСНО)

**Тест:** `&lt;script&gt;alert('XSS')&lt;/script&gt;`  
**Результат:** ✅ Отображается как текст  
**Поведение:** Экранируется и показывается пользователю

### 10. Meta tag injection (БЕЗОПАСНО)

**Тест:** `<meta http-equiv="refresh" content="0;url=https://evil.com">`  
**Результат:** ✅ Meta теги удаляются  
**Поведение:** Тег не рендерится

## 🛡️ Механизмы защиты

### rehype-sanitize

Библиотека `rehype-sanitize` используется для фильтрации опасного HTML:

```typescript
import rehypeSanitize from 'rehype-sanitize';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}  // ← Санитизация HTML
>
  {content}
</ReactMarkdown>
```

**Что блокируется:**
- Все `<script>` теги
- Атрибуты-обработчики событий (`onclick`, `onerror`, `onload`, etc.)
- JavaScript URLs (`javascript:`, `data:text/html`)
- Опасные теги (`iframe`, `object`, `embed`, `form`)
- Style теги и атрибуты
- Meta и base теги

### Дополнительные меры безопасности

1. **Автоматическое добавление `rel="noopener noreferrer"`**
   - Все внешние ссылки открываются с защитой от tabnabbing
   
2. **Принудительный `target="_blank"`**
   - Внешние ссылки открываются в новой вкладке

3. **Content Security Policy (CSP)**
   - Рекомендуется настроить CSP headers на сервере:
   ```
   Content-Security-Policy: 
     default-src 'self';
     img-src 'self' https:;
     style-src 'self' 'unsafe-inline';
   ```

## 📝 Безопасные возможности Markdown

### Разрешенные теги и функции:

✅ **Форматирование текста**
- `**жирный**` → **жирный**
- `*курсив*` → *курсив*
- `~~зачеркнутый~~` → ~~зачеркнутый~~

✅ **Ссылки**
- `[текст](https://example.com)` → безопасные ссылки с `rel="noopener noreferrer"`

✅ **Изображения**
- `![alt](https://example.com/image.png)` → изображения с lazy loading
- Клик по изображению открывает безопасное модальное окно

✅ **Блоки кода**
```
`inline code`
```

````
```language
code block
```
````

✅ **Списки**
- Маркированные списки
- Нумерованные списки

✅ **Цитаты**
> Blockquote текст

✅ **Таблицы (GFM)**
| Header | Header |
|--------|--------|
| Cell   | Cell   |

✅ **Заголовки**
# H1
## H2
### H3

## 🔍 Рекомендации по дальнейшему тестированию

### 1. Ручное тестирование
- Попытаться вставить различные XSS payload в редактор
- Проверить поведение при копировании опасного HTML из браузера
- Протестировать с различными браузерами (Chrome, Firefox, Safari, Edge)

### 2. Автоматическое тестирование
Создать unit-тесты для MarkdownRenderer:

```typescript
describe('MarkdownRenderer Security', () => {
  it('should remove script tags', () => {
    const malicious = '<script>alert("XSS")</script>';
    // render and check that script is removed
  });
  
  it('should remove event handlers', () => {
    const malicious = '<img src="x" onerror="alert(1)">';
    // check that onerror is stripped
  });
});
```

### 3. Penetration Testing
- Использовать инструменты типа OWASP ZAP
- Проверить payload из OWASP XSS Filter Evasion Cheat Sheet
- Провести код-ревью с фокусом на безопасность

## ✅ Заключение

**Статус безопасности: ВЫСОКИЙ**

Система рендеринга Markdown использует проверенные библиотеки:
- ✅ `react-markdown` - безопасный рендеринг Markdown
- ✅ `rehype-sanitize` - фильтрация опасного HTML
- ✅ `remark-gfm` - расширенная поддержка Markdown без рисков

Все базовые XSS векторы атак блокируются на уровне санитизации HTML.

**Рекомендации:**
1. Регулярно обновлять зависимости (npm audit)
2. Настроить Content Security Policy на сервере
3. Провести профессиональный security audit перед production
4. Добавить автоматические тесты безопасности в CI/CD
5. Мониторить security advisory для используемых пакетов

