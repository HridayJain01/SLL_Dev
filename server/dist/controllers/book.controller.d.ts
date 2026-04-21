import { Request, Response, NextFunction } from 'express';
export declare function listBooks(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getBookById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createBook(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateBook(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteBook(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=book.controller.d.ts.map