const fs = require('fs');
const path = require('path');

const filesToFix = [
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\transaction\\services\\processors\\shares-transaction.processor.ts",
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\transaction\\services\\processors\\savings-transaction.processor.ts",
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\transaction\\services\\processors\\request-transaction.processor.ts",
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\transaction\\services\\processors\\loan-transaction.processor.ts",
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\transaction\\services\\processors\\admin-transaction.processor.ts",
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\loan\\services\\loan.service.ts",
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\loan\\services\\eligibility.service.ts",
  "c:\\Users\\G-LIGHT\\Desktop\\finance\\server\\src\\modules\\loan\\services\\repayment.service.ts"
];

for (const file of filesToFix) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('new PrismaClient()')) {
    content = content.replace(/new PrismaClient\(\)/g, 'prisma');
    
    // Check if imported
    if (!content.includes('import { prisma') && !content.includes('import prisma')) {
      content = "import { prisma } from '@/prisma';\n" + content;
    }
    
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
