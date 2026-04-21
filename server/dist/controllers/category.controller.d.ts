import { Request, Response, NextFunction } from 'express';
export declare function listCategories(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function createCategory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCategory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteCategory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=category.controller.d.ts.map