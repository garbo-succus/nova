import fs from 'node:fs/promises';import sharp from 'sharp';import{PDFDocument,PDFRef,PDFName}from'pdf-lib';
await fs.mkdir('.cache',{recursive:true});
const pdf=await PDFDocument.load(await fs.readFile('sources/pnp/Tables_Nova.pdf'));
const ref=PDFRef.of(18);const previous=pdf.context.lookup(ref);const {data,info}=await sharp('sources/enhanced/reference-banner.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
const replacement=pdf.context.flateStream(data,{Type:'XObject',Subtype:'Image',Width:info.width,Height:info.height,ColorSpace:'DeviceRGB',BitsPerComponent:8,SMask:previous.dict.get(PDFName.of('SMask'))});pdf.context.assign(ref,replacement);await fs.writeFile('.cache/Tables-enhanced.pdf',await pdf.save());console.log('Enhanced banner only:',info.width,info.height);
