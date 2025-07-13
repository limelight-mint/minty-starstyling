/* eslint-disable curly */
import SettingsService from './services/settings-service';
import { isComment, checkForFunctionAfterComment, isCommentBlockStart, isCommentBlockEnd, isFunctionOrExportDeclaration, shouldSkipIndentation, shouldSkipProcessing, isReturnAnonymousObject, isAnonymousObjectOneLiner, isCollapsedAnonymousObject } from './validator';

//module level (to not pass sausages on each function) 🌭
let commentBlockStarted = false;

export function format(text: string, isTypeScript: boolean = false): string 
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

function handleControlStructurePatterns(line: string): string 
{
    line = line.replace(/}\s*else\s*{/g, '}\nelse\n{');
    line = line.replace(/}\s*else/g, '}\nelse');
    line = line.replace(/else\s*{/g, 'else\n{');
    return line;
}

//FIXME: need to fix spaces in default scenarios: e.g `const anyType: type = "sfd";` will be `const anyType : type = "sdf";` same with generics <Promise>
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
    
    if(isReturnAnonymousObject(line)) return [line]; //return as it is, since user might wanted to do anonymous object (`return { obj: true };`)
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

            // Handle closing brace with comma (json type of anon object)
            if (char === '}' && nextChar === ',') 
            {
                result += '\n},\n';
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
    return result.split('\n').filter(lines => lines.trim() !== '').map(line => line.trim());
}

function applyIndentation(preprocessed: string[]): string 
{
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = 4;
    let lastWasFunctionOrExport = false;
    let isAnonymousObject = false;
    
    for (let i = 0; i < preprocessed.length; i++) 
    {
        let trimmedLine = preprocessed[i];
        
        // Handle comment blocks FIRST (before skipping indentation)
        const commentResult = handleCommentBlock(trimmedLine, i, preprocessed, formattedLines, lastWasFunctionOrExport, indentLevel, indentSize);
        if (commentResult) 
        {
            continue;
        }

        if(i+1 >= preprocessed.length)
        {
            isAnonymousObject = isReturnAnonymousObject(trimmedLine) && !isAnonymousObjectOneLiner(trimmedLine); //check if this was return type anonymous object, if so, next line should be indented
        }
        else
        {
            const nextLine = preprocessed[i+1];
            //Edge case where really long string (prettier bug) `function getSocials() { return { socials: { "friends": [52, 432, 69] } }; }`
            if(isCollapsedAnonymousObject(trimmedLine, nextLine))
            {
                if(trimmedLine[trimmedLine.length-1] === ' ') trimmedLine += '{';
                else trimmedLine += ' {';
                preprocessed[i+1] = nextLine.substring(1); //FIXME: due to that '{' bracket that will go to the previous line for return {, it will leave the empty line
                isAnonymousObject = true;
            }
            else
            {
                isAnonymousObject = isReturnAnonymousObject(trimmedLine) && !isAnonymousObjectOneLiner(trimmedLine);
            }
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
        if (trimmedLine === '}' || trimmedLine === '};' || trimmedLine === '},') 
        {
            indentLevel = Math.max(0, indentLevel - 1);
            isAnonymousObject = false;
        }
        
        // Add current line with proper indentation
        const indent = ' '.repeat(indentLevel * indentSize);
        formattedLines.push(indent + trimmedLine);
        
        // Handle opening braces - increase indent after adding
        if (trimmedLine === '{' || isAnonymousObject) 
        {
            indentLevel++;
        }
        
        lastWasFunctionOrExport = isFunctionOrExport;
    }
    
    return formattedLines.join('\n');
}

function handleCommentBlock(line: string, index: number, preprocessed: string[], formattedLines: string[], lastWasFunctionOrExport: boolean, indentLevel: number, indentSize: number): boolean 
{
    if (isCommentBlockStart(line)) 
    {
        commentBlockStarted = true;
        const hasFunctionAfter = checkForFunctionAfterComment(index, preprocessed);
        
        if (hasFunctionAfter && formattedLines.length > 0 && !lastWasFunctionOrExport) 
        {
            formattedLines.push('');
            formattedLines.push('');
        }
    }
    
    if (isCommentBlockEnd(line)) 
    {
        commentBlockStarted = false;
    }
    
    // Skip indentation for comments
    if (isComment(line)) 
    {
        const indent = ' '.repeat(indentLevel * indentSize);
        formattedLines.push(indent + line);
        return true;
    }
    
    return false;
}

function addSpacingBeforeFunction(line: string, formattedLines: string[], lastWasFunctionOrExport: boolean, isFunctionOrExport: boolean): void 
{
    const settings = new SettingsService();
    const previousLine = formattedLines.length > 0 ? formattedLines[formattedLines.length - 1] : '';
    const previousLineIsComment = isComment(previousLine);
    
    if (isFunctionOrExport && formattedLines.length > 0 && !lastWasFunctionOrExport && !previousLineIsComment) 
    {
        for (let i = 0; i < settings.get.howManyLinesToAdd; i++) {
            formattedLines.push('');
        }
    }
}