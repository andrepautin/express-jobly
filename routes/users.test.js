"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u4Token,
} = require("./_testCommon");
const { UnauthorizedError } = require("../expressError.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/********************************************************** POST /users */

describe("POST /users", function () {
  /************************************** admin tests */
  describe("admin test", function () {
    test("works for admin: create non-admin", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        user: {
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          email: "new@email.com",
          isAdmin: false,
        }, token: expect.any(String),
      });
    });

    test("works for admin: create admin", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        user: {
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          email: "new@email.com",
          isAdmin: true,
        }, token: expect.any(String),
      });
    });

    test("admin: bad request if missing data", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("admin: bad request if invalid data", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("fails for users: create non-admin", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 }
      });
    });

    test("fails for users: create admin", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 }
      });
    });

    test("user: bad request if missing data", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("user: bad request if invalid data", async function () {
      const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      });
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /users */

describe("GET /users", function () {
  /************************************** admin tests */
  test("works for admin", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
        {
          username: "uAdmin",
          firstName: "u4Admin",
          lastName: "U4A",
          email: "user4@user.com",
          isAdmin: true,
        }
      ],
    });
  });
  /************************************** non-admin user tests */
  test("fails for users", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      error: { message: "Unauthorized", status: 401 }
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE users CASCADE");
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u4Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /users/:username */

describe("GET /users/:username", function () {
  /************************************** admin tests */
  describe("admin test", function () {
    test("works for admin", async function () {
      const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({
        user: {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
      });
    });

    test("admin: not found if user not found", async function () {
      const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
  /************************************** non-admin user tests */
  describe("user test", function () {
    test("works for correct user", async function () {
      const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        user: {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
      });
    });

    test("fails for different user", async function () {
      const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
      console.log("RESPONSE BODY--->", resp.body);
      expect(resp.statusCode).toEqual(401)
    });

    test("user: not found if user not found", async function () {
      const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {
  /************************************** admin tests */
  describe("admin test", function () {
    test("works for admin", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({
        user: {
          username: "u1",
          firstName: "New",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
      });
    });

    test("fails for admin: not found if no such user", async function () {
      const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });

    test("fails for admin: bad request if invalid data", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("works for admin: set new password", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({
        user: {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
      });
      const isSuccessful = await User.authenticate("u1", "new-password");
      expect(isSuccessful).toBeTruthy();
    });
    
  });
  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("works for correct user", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        user: {
          username: "u1",
          firstName: "New",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
      });
    });

    test("fails for different user", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("unauth diff user: bad request if invalid data", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("works for correct user: set new password", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        user: {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
      });
      const isSuccessful = await User.authenticate("u1", "new-password");
      expect(isSuccessful).toBeTruthy();
    });

    test("fails for diff user: set new password", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          password: "new-password",
        })
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
      try {
        await User.authenticate("u1", "new-password");
        fail();
      } catch (err) {
        console.log("ERROR--->", err);
        expect(err instanceof UnauthorizedError).toBeTruthy();
      }
    });

    test("fails for user: bad request if invalid data", async function () {
      const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      });
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {
  /************************************** admin tests */
  describe("admin tests", function () {
    test("works for admin", async function () {
      const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({ deleted: "u1" });
    });
    test("fails for admin: not found if user missing", async function () {
      const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });
  });
  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("works for correct user", async function () {
      const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({ deleted: "u1" });
    });

    test("fails for diff user", async function () {
      const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("unauth for user: not found if user missing", async function () {
      const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

});
