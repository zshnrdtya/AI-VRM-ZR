import fs from 'fs/promises'
import path from 'path'

export class FileAccessService {
  private rootDir: string

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir)
  }

  /**
   * Verify if a path is within the allowed root directory to prevent directory traversal
   */
  private verifyPath(targetPath: string): string {
    const resolvedPath = path.resolve(this.rootDir, targetPath)
    if (!resolvedPath.startsWith(this.rootDir)) {
      throw new Error(`Security Violation: Access denied to path outside project root: ${targetPath}`)
    }
    return resolvedPath
  }

  /**
   * Scan directory and return structure, ignoring common large/unnecessary folders
   */
  async scanDirectory(dirPath: string = '.'): Promise<string[]> {
    const resolvedPath = this.verifyPath(dirPath)
    const result: string[] = []
    
    // Ignore patterns
    const ignoreList = ['node_modules', '.git', 'dist', 'out', '.next', 'build']

    async function scan(currentDir: string, relativePath: string) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true })
      
      for (const entry of entries) {
        if (ignoreList.includes(entry.name)) continue

        const entryRelativePath = path.join(relativePath, entry.name)
        const entryFullPath = path.join(currentDir, entry.name)

        if (entry.isDirectory()) {
          result.push(entryRelativePath + '/')
          await scan(entryFullPath, entryRelativePath)
        } else {
          result.push(entryRelativePath)
        }
      }
    }

    await scan(resolvedPath, dirPath === '.' ? '' : dirPath)
    return result
  }

  /**
   * Read file content safely
   */
  async readFile(filePath: string): Promise<string> {
    const resolvedPath = this.verifyPath(filePath)
    try {
      return await fs.readFile(resolvedPath, 'utf-8')
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`)
    }
  }

  /**
   * Write content to file safely
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const resolvedPath = this.verifyPath(filePath)
    try {
      // Ensure directory exists
      const dirname = path.dirname(resolvedPath)
      await fs.mkdir(dirname, { recursive: true })
      
      await fs.writeFile(resolvedPath, content, 'utf-8')
    } catch (error: any) {
      throw new Error(`Failed to write file ${filePath}: ${error.message}`)
    }
  }
}
