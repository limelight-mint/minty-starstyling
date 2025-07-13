

export function isFunctionOrExportDeclaration(line: string): boolean 
{
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('function') || trimmedLine.startsWith('class') || trimmedLine.startsWith('constructor') ||
           (trimmedLine.startsWith('export') && !trimmedLine.includes('from')) ||
           (trimmedLine.startsWith('const') && trimmedLine.includes('function')) ||
           (trimmedLine.startsWith('let') && trimmedLine.includes('function')) ||
           (trimmedLine.startsWith('var') && trimmedLine.includes('function')) ||
           (trimmedLine.match(/^[A-Za-z_$][A-Za-z0-9_$]*\s*\(\)\s*$/) !== null && !line.includes('function'));
}

export function isCollapsedAnonymousObject(trimmedLine: string, nextLine: string | undefined)
{
    if(nextLine === undefined)
    {
        return false;
    }
    return trimmedLine.includes('return') && !trimmedLine.includes(';') && !trimmedLine.includes('{') && nextLine.trim().startsWith('{');
}

export function isReturnAnonymousObject(line: string): boolean
{
    const trimmedLine = line.trim();
    if(trimmedLine.startsWith('return{') || trimmedLine.startsWith('return {')) 
    {
        return true;
    }
    else 
    {
        return false;
    }
}

/**
 * To check if the anon object properly opened and closed on the same line (`return { coffee: { 'cost': '12.00', inredients: [] } } }`)
 */
export function isAnonymousObjectOneLiner(line: string): boolean
{
    if(!isReturnAnonymousObject(line)) 
    {
        return false;
    }
    
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    
    for(let i = 0; i < line.length; i++) 
    {
        const char = line[i];
        
        // Track string contexts to avoid counting braces inside strings
        if((char === "'" || char === '"') && !inString) 
        {
            inString = true;
            stringChar = char;
        }
        else if(char === stringChar && inString) 
        {
            inString = false;
            stringChar = '';
        }
        
        // Count braces only when not inside strings
        if(!inString) 
        {
            if(char === '{') 
            {
                braceCount++;
            }
            if(char === '}') 
            {
                braceCount--;
            }
        }
    }
    
    return braceCount === 0; // Properly closed if braces match
}

export function checkForFunctionAfterComment(commentIndex: number, preprocessed: string[]): boolean 
{
    for (let j = commentIndex + 1; j < preprocessed.length; j++) 
    {
        const nextLine = preprocessed[j];
        if (isCommentBlockEnd(nextLine)) 
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

export function shouldSkipIndentation(line: string): boolean 
{
    const trimmedLine = line.trim();
    return trimmedLine.startsWith('import') || 
           (trimmedLine.startsWith('export') && trimmedLine.includes('from')) ||
           isComment(line);
}


export function shouldSkipProcessing(line: string): boolean 
{
    // Skip comments
    if (isComment(line)) 
    {
        return true;
    }
    
    return false;
}

export function isComment(line: string): boolean
{
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || isCommentBlockStart(line) || 
        trimmedLine.startsWith('*') || isCommentBlockEnd(line)) 
    {
        return true;
    }
    
    return false;
}

//TODO: Maybe add /** also
export function isCommentBlockStart(line: string): boolean
{
    const trimmedLine = line.trim();
    if(trimmedLine.startsWith('/*'))
    {
        return true;
    }
    else
    {
        return false;
    }
}

//TODO: Maybe add **/ also
export function isCommentBlockEnd(line: string): boolean
{
    const trimmedLine = line.trim();
    if(trimmedLine.startsWith('*/') || trimmedLine.endsWith('*/'))
    {
        return true;
    }
    else
    {
        return false;
    }
}