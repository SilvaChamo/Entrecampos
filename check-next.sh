#!/bin/bash
cd /Users/macbook/Desktop/APP/entrecampos

echo "=== Verificando Next.js ==="
if [ -d "node_modules/next" ]; then
    echo "✓ Pasta next existe"
    if [ -f "node_modules/next/dist/bin/next" ]; then
        echo "✓ Binário next existe"
        ls -la node_modules/next/dist/bin/next
    else
        echo "✗ Binário next NÃO existe"
        echo "Conteúdo de node_modules/next/dist/:"
        ls -la node_modules/next/dist/ 2>&1 || echo "Pasta dist não existe"
    fi
else
    echo "✗ Pasta next NÃO existe"
    echo "node_modules existe?"
    ls -la node_modules 2>&1 | head -3 || echo "node_modules não existe"
fi

echo ""
echo "=== Verificando .bin ==="
if [ -L "node_modules/.bin/next" ]; then
    echo "✓ Symlink next existe"
    ls -la node_modules/.bin/next
else
    echo "✗ Symlink next NÃO existe"
fi
