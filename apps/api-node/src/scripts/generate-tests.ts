import fs from 'fs'
import path from 'path'

const srcDir = path.resolve('src')
const testDir = path.resolve('tests')

interface FileSystemEntry {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
}

function createTestStructure(srcPath: string, testPath: string): void {
  const entries: FileSystemEntry[] = fs.readdirSync(srcPath, { withFileTypes: true }) as unknown as FileSystemEntry[]

  for (const entry of entries) {
    const srcEntryPath: string = path.join(srcPath, entry.name)
    const testEntryPath: string = path.join(testPath, entry.name)

    if (entry.isDirectory()) {
      // Cria diretório correspondente em tests/
      if (!fs.existsSync(testEntryPath)) {
        fs.mkdirSync(testEntryPath, { recursive: true })
        console.log(`📁 Criado: ${testEntryPath}`)
      }
      createTestStructure(srcEntryPath, testEntryPath) // recursivo
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const testFileName: string = entry.name.replace('.js', '.test.js')
      const testFilePath: string = path.join(testPath, testFileName)

      if (!fs.existsSync(testFilePath)) {
        fs.writeFileSync(testFilePath, `// Testes para ${entry.name}\n\ndescribe('${entry.name}', () => {\n  it('deve fazer algo', () => {\n    // TODO\n  });\n});\n`)
        console.log(`🧪 Criado: ${testFilePath}`)
      }
    }
  }
}

createTestStructure(srcDir, testDir)
