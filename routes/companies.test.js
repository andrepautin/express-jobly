"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u4Token,
} = require("./_testCommon");
const Company = require("../models/company");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };
  /************************************** admin tests */
  describe("admin test", function () {
    test("works with admin", async function () {
      const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        company: newCompany,
      });
    });

    test("admin bad request with missing data", async function () {
      const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("admin bad request with invalid data", async function () {
      const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("user: unauthorized", async function () {
      const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 },
      });
    });

    test("user unauth: bad request with missing data", async function () {
      const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("user unauth: bad request with invalid data", async function () {
      const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

});

/************************************** GET /companies */

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
        [
          {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
          {
            handle: "c2",
            name: "C2",
            description: "Desc2",
            numEmployees: 2,
            logoUrl: "http://c2.img",
          },
          {
            handle: "c3",
            name: "C3",
            description: "Desc3",
            numEmployees: 3,
            logoUrl: "http://c3.img",
          },
        ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
      .get("/companies")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
  /************************************** filter tests */
  describe("query filter test", function () {
    test("fails if minEmployees > maxEmployees", async function () {
      let resp = await request(app).get("/companies?minEmployees=10&maxEmployees=2");
      expect(resp.statusCode).toEqual(400);
    });

    test("fails if passed bad query string", async function () {
      let resp = await request(app).get("/companies?isAdmin=true");
      expect(resp.statusCode).toEqual(400);
    });

    test("error if no companies matching filter", async function () {
      let resp = await request(app).get("/companies?name=d");
      expect(resp.statusCode).toEqual(404)
      expect(resp.body).toEqual({
        "error": {
          "message": "No matching companies",
          "status": 404
        }
      });
    });
    test("successful filtering name + min", async function () {
      let resp = await request(app).get("/companies?name=c&minEmployees=2");
      expect(resp.body).toEqual({
        companies:
          [
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img",
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img",
            },
          ],
      });
    });
  });
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  /************************************** admin tests */
  describe("admin test", function () {
    test("works for admin", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({
        company: {
          handle: "c1",
          name: "C1-new",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      });
    });

    test("admin not found on no such company", async function () {
      const resp = await request(app)
        .patch(`/companies/nope`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });

    test("admin bad request on handle change attempt", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("admin bad request on invalid data", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

  });
  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("user unauth: fail", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 },
      });
    });

    test("user unauth: not found on no such company", async function () {
      const resp = await request(app)
        .patch(`/companies/nope`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("user unauth: bad request on invalid data", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("user unauth: bad request on handle change attempt", async function () {
      const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

  });

  /************************************** anon tests */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
  /************************************** admin tests */
  describe("admin test", function () {
    test("works for admin", async function () {
      const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({ deleted: "c1" });
    });

    test("admin not found for no such company", async function () {
      const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });

  });

  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("unauth for users", async function () {
      const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 },
      });
    });

    test("user unauth: not found for no such company", async function () {
      const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  /************************************** anon user tests */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

});
