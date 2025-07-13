//module level (to not pass sausages on each function) 🌭
let commentBlockStarted = false;

export function formatWithOOPStyle(text: string, isTypeScript: boolean = false): string 
{
    const preprocessed = preprocessLines(text, isTypeScript);
    return applyIndentation(preprocessed);
}

function preprocessLines(text: string, isTypeScript: boolean): string[] 
{
    const preprocessed: string[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) 
    {
        let line = lines[i].trim();
        
        // Handle import/require statements BEFORE any processing
        if (line.startsWith('import') || line.startsWith('require')) 
        {
            const { collectedImport, linesSkipped } = collectImportStatement(lines, i);
            preprocessed.push(collectedImport);
            i += linesSkipped - 1; // -1 because the loop will increment i
            continue;
        }
        
        // Skip comments
        if (shouldSkipProcessing(line)) 
        {
            preprocessed.push(line);
            continue;
        }
        
        // Handle control structure patterns
        line = handleControlStructurePatterns(line);
        
        // Apply TypeScript enhancements
        if (isTypeScript) 
        {
            line = applyTypeScriptEnhancements(line);
        }
        
        // Process braces (only for non-comment lines)
        const processedLines = processBraces(line);
        preprocessed.push(...processedLines);
    }
    
    return preprocessed;
}

function collectImportStatement(lines: string[], startIndex: number): { collectedImport: string, linesSkipped: number } 
{
    let collectedLines: string[] = [];
    let linesSkipped = 0;
    let i = startIndex;
    let inString = false;
    let stringChar = '';
    let quoteCount = 0;
    
    while (i < lines.length) 
    {
        const line = lines[i].trim();
        linesSkipped++;
        
        // Check if this line starts a new import/require
        if (i > startIndex && (line.startsWith('import') || line.startsWith('require'))) 
        {
            break;
        }
        
        // Check if this line is empty
        if (line === '') 
        {
            break;
        }
        
        // Track string contexts and count quotes
        for (let j = 0; j < line.length; j++) 
        {
            const char = line[j];
            
            if ((char === "'" || char === '"') && !inString) 
            {
                inString = true;
                stringChar = char;
                quoteCount++;
            }
            else if (char === stringChar && inString) 
            {
                inString = false;
                stringChar = '';
                quoteCount++;
            }
        }
        
        // Add the line to our collection
        collectedLines.push(line);
        
        // Stop if we found a semicolon (outside of string) OR if we have 2 quotes (opening and closing)
        if ((!inString && line.includes(';')) || quoteCount >= 2) 
        {
            break;
        }
        
        i++;
    }
    
    // Combine all collected lines into one
    const collectedImport = collectedLines.join(' ');
    
    return { collectedImport, linesSkipped };
}

function shouldSkipProcessing(line: string): boolean 
{
    // Skip comments
    if (line.startsWith('//') || line.startsWith('/*') || 
        line.startsWith('*') || line.startsWith('*/')) 
    {
        return true;
    }
    
    return false;
}

function handleControlStructurePatterns(line: string): string 
{
    line = line.replace(/}\s*else\s*{/g, '}\nelse\n{');
    line = line.replace(/}\s*else/g, '}\nelse');
    line = line.replace(/else\s*{/g, 'else\n{');
    return line;
}

function applyTypeScriptEnhancements(line: string): string 
{
    return line.replace(/\)\s*:\s*([A-Za-z_$][A-Za-z0-9_$<>]*)/g, ') : $1');
}

function processBraces(line: string): string[] 
{
    let result = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;
    let i = 0;
    
    while (i < line.length) 
    {
        const char = line[i];
        const nextChar = line[i + 1];
        
        // Track string contexts
        if (char === "'" && !inDoubleQuote && !inBacktick) 
        {
            inSingleQuote = !inSingleQuote;
        }
        if (char === '"' && !inSingleQuote && !inBacktick) 
        {
            inDoubleQuote = !inDoubleQuote;
        }
        if (char === '`' && !inSingleQuote && !inDoubleQuote) 
        {
            inBacktick = !inBacktick;
        }
        
        // Only process braces if not inside any string
        if (!inSingleQuote && !inDoubleQuote && !inBacktick) 
        {
            // Handle opening brace
            if (char === '{' && nextChar !== '{') 
            {
                result += '\n{\n';
                i++;
                continue;
            }
            
            // Handle closing brace with semicolon
            if (char === '}' && nextChar === ';') 
            {
                result += '\n};\n';
                i += 2;
                continue;
            }
            
            // Handle closing brace without semicolon
            if (char === '}' && nextChar !== '}') 
            {
                result += '\n}\n';
                i++;
                continue;
            }
        }
        
        result += char;
        i++;
    }
    
    // Remove empty lines
    return result.split('\n').filter(l => l.trim() !== '').map(l => l.trim());
}

function applyIndentation(preprocessed: string[]): string 
{
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = 4;
    let lastWasFunctionOrExport = false;
    
    for (let i = 0; i < preprocessed.length; i++) 
    {
        const trimmedLine = preprocessed[i];
        
        // Handle comment blocks FIRST (before skipping indentation)
        const commentResult = handleCommentBlock(trimmedLine, i, preprocessed, formattedLines, lastWasFunctionOrExport, indentLevel, indentSize);
        if (commentResult) 
        {
            continue;
        }
        
        // Handle special cases (imports, etc.)
        if (shouldSkipIndentation(trimmedLine)) 
        {
            formattedLines.push(trimmedLine);
            continue;
        }
        
        // Check if this is a function or export
        const isFunctionOrExport = isFunctionOrExportDeclaration(trimmedLine);
        
        // Add spacing before functions
        addSpacingBeforeFunction(trimmedLine, formattedLines, lastWasFunctionOrExport, isFunctionOrExport);
        
        // Handle closing braces - reduce indent before adding
        if (trimmedLine === '}' || trimmedLine === '};') 
        {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add current line with proper indentation
        const indent = ' '.repeat(indentLevel * indentSize);
        formattedLines.push(indent + trimmedLine);
        
        // Handle opening braces - increase indent after adding
        if (trimmedLine === '{') 
        {
            indentLevel++;
        }
        
        lastWasFunctionOrExport = isFunctionOrExport;
    }
    
    return formattedLines.join('\n');
}

function shouldSkipIndentation(line: string): boolean 
{
    return line.startsWith('import') || 
           (line.startsWith('export') && line.includes('from')) ||
           line.startsWith('//') || 
           line.startsWith('/**') || 
           line.startsWith('/*') || 
           line.startsWith('*') || 
           line.startsWith('**/') || 
           line.startsWith('*/');
}

function handleCommentBlock(line: string, index: number, preprocessed: string[], formattedLines: string[], lastWasFunctionOrExport: boolean, indentLevel: number, indentSize: number): boolean 
{
    if (line.startsWith('/**') || line.startsWith('/*')) 
    {
        commentBlockStarted = true;
        const hasFunctionAfter = checkForFunctionAfterComment(index, preprocessed);
        
        if (hasFunctionAfter && formattedLines.length > 0 && !lastWasFunctionOrExport) 
        {
            formattedLines.push('');
            formattedLines.push('');
        }
    }
    
    if (line.startsWith('**/') || line.startsWith('*/')) 
    {
        commentBlockStarted = false;
    }
    
    // Skip indentation for comments
    if (line.startsWith('//') || line.startsWith('/**') || line.startsWith('/*') || 
        line.startsWith('*') || line.startsWith('**/') || line.startsWith('*/')) 
    {
        const indent = ' '.repeat(indentLevel * indentSize);
        formattedLines.push(indent + line);
        return true;
    }
    
    return false;
}

function checkForFunctionAfterComment(commentIndex: number, preprocessed: string[]): boolean 
{
    for (let j = commentIndex + 1; j < preprocessed.length; j++) 
    {
        const nextLine = preprocessed[j];
        if (nextLine.startsWith('*/') || nextLine.startsWith('**/')) 
        {
            for (let k = j + 1; k < preprocessed.length; k++) 
            {
                const potentialFunction = preprocessed[k];
                if (isFunctionOrExportDeclaration(potentialFunction)) 
                {
                    return true;
                }
                if (!potentialFunction.startsWith('*') && !potentialFunction.startsWith('//')) 
                {
                    break;
                }
            }
            break;
        }
    }
    return false;
}

function isFunctionOrExportDeclaration(line: string): boolean 
{
    return line.startsWith('function') || 
           (line.startsWith('export') && !line.includes('from')) ||
           (line.startsWith('const') && line.includes('function')) ||
           (line.startsWith('let') && line.includes('function')) ||
           (line.startsWith('var') && line.includes('function')) ||
           (line.match(/^[A-Za-z_$][A-Za-z0-9_$]*\s*\(\)\s*$/) !== null && !line.includes('function'));
}

function addSpacingBeforeFunction(line: string, formattedLines: string[], lastWasFunctionOrExport: boolean, isFunctionOrExport: boolean): void 
{
    const previousLine = formattedLines.length > 0 ? formattedLines[formattedLines.length - 1] : '';
    const previousLineIsComment = previousLine.trim().startsWith('//') || 
                               previousLine.trim().startsWith('/*') || 
                               previousLine.trim().startsWith('*') || 
                               previousLine.trim().startsWith('*/');
    
    if (isFunctionOrExport && formattedLines.length > 0 && !lastWasFunctionOrExport && !previousLineIsComment) 
    {
        formattedLines.push('');
        formattedLines.push('');
    }
}