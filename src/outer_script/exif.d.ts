interface EXIFStatic {
  getData(url: any, callback: any): any
  getTag(img: any, tag: any): any
  getAllTags(img: any): any
  pretty(img: any): string
  readFromBinaryFile(file: any): any
}

declare let EXIF: EXIFStatic
export = EXIF