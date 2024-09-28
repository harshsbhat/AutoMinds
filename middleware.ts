// //we are exportinh auth as middleware , and the auth is the handler from next-auth , so we can use it as middleware in our routes
// // basically it will not logout the user if the user is authenticated
// export {auth as middleware } from "./auth"

// // /this config is used to exclude the api routes from the middleware
// // means we dont want to use the middleware for all api routes
// // this regex exculde apis with the following pattern
// // and the pattern is /api/ or /_next/static or /_next/image or any file with .png extension
// // so the middleware will not be applied to these routes 
// export const config = {
//     matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
// };