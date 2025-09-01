import type { Context } from "hono";

/**
 * @api {get} /users Get All Users
 * @apiGroup Users
 * @access Private
 */
// export const getUsers = async (c: Context) => {
//   const res = await db.query.
//   const users = await mongoDb.collection("users").find().toArray();
//   return c.json(users);
// };

/**
 * @api {get} /users/:id Get Single User
 * @apiGroup Users
 * @access Private
 */
export const getUserById = async (c: Context) => {
  // return await db.query.users
  //   .findFirst({
  //     where: (users, { eq }) => eq(users.id, c.req.param("id")),
  //   })
  //   .then((user) => {
  //     if (!user) {
  //       return c.json({ success: false, message: "User not found" }, 404);
  //     }
  //     return c.json(user);
  //   })
  //   .catch((error: Error) => {
  //     console.error("Error fetching user:", error);
  //     return c.json({ success: false, message: "Internal server error" }, 500);
  //   });
};

/**
 * @api {put} /users/profile Edit User Profile
 * @apiGroup Users
 * @access Private
 */
export const editProfile = async (c: Context) => {};

/**
 * @api {get} /users/profile Get User Profile
 * @apiGroup Users
 * @access Private
 */
export const getProfile = async (c: Context) => {};
