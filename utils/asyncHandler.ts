// const asyncHandler = (fn: any) => {
//     return async (req: any, res: any, next: any) => {
//         try {
//             await fn(req, res, next);
//         } catch (error: any) {
//             res.status(error.statusCode || 500).json({
//                 success: false,
//                 message: error.message || "Something went wrong",
//             });
//         }
//     };
// };

// export default asyncHandler;
