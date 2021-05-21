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
  u2Token,
  u4Token,
  jobResultIds,
} = require("./_testCommon");
const Job = require("../models/job");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "Dancer",
    salary: 40000,
    equity: "0.004",
    companyHandle: "c1",
  };
  /************************************** admin tests */
  describe("admin test", function () {
    test("works with admin", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "Dancer",
          salary: 40000,
          equity: "0.004",
          companyHandle: "c1",
        },
      });
    });

    test("admin bad request with missing data", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Missing Data",
          salary: 40000,
          equity: "0.004",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("admin bad request with invalid data", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Dancer",
          salary: 40000,
          equity: "0.004",
          companyHandle: "doesntexist",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });
  });
  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("user: unauthorized", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 },
      });
    });

    test("user unauth: bad request with missing data", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Missing Data",
          salary: 40000,
          equity: "0.004",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("user unauth: bad request with invalid data", async function () {
      const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Dancer",
          salary: 40000,
          equity: "0.004",
          companyHandle: "doesntexist",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
      [
        {
          id: expect.any(Number),
          title: "Manager",
          salary: 10000,
          equity: '0.010',
          companyHandle: 'c1'
        },
        {
          id: expect.any(Number),
          title: "Receptionist",
          salary: 20000,
          equity: '0.020',
          companyHandle: 'c2'
        },
        {
          id: expect.any(Number),
          title: "Custodian",
          salary: 30000,
          equity: '0.030',
          companyHandle: 'c3'
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
  /************************************** filter tests */
  // describe("query filter test", function () {
  //   test("fails if minEmployees > maxEmployees", async function () {
  //     let resp = await request(app).get("/jobs?minEmployees=10&maxEmployees=2");
  //     expect(resp.statusCode).toEqual(400);
  //   });

  //   test("fails if passed bad query string", async function () {
  //     let resp = await request(app).get("/jobs?isAdmin=true");
  //     expect(resp.statusCode).toEqual(400);
  //   });

  //   test("error if no jobs matching filter", async function () {
  //     let resp = await request(app).get("/jobs?name=d");
  //     expect(resp.statusCode).toEqual(404)
  //     expect(resp.body).toEqual({
  //       "error": {
  //         "message": "No matching jobs",
  //         "status": 404
  //       }
  //     });
  //   });
  //   test("successful filtering name + min", async function () {
  //     let resp = await request(app).get("/jobs?name=c&minEmployees=2");
  //     expect(resp.body).toEqual({
  //       jobs:
  //         [
  //           {
  //             handle: "c2",
  //             name: "C2",
  //             description: "Desc2",
  //             numEmployees: 2,
  //             logoUrl: "http://c2.img",
  //           },
  //           {
  //             handle: "c3",
  //             name: "C3",
  //             description: "Desc3",
  //             numEmployees: 3,
  //             logoUrl: "http://c3.img",
  //           },
  //         ],
  //     });
  //   });
  // });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${jobResultIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "Manager",
        salary: 10000,
        equity: '0.010',
        companyHandle: 'c1'
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:id", function () {
  /************************************** admin tests */
  describe("admin test", function () {
    test("works for admin", async function () {
      const resp = await request(app)
        .patch(`/jobs/${jobResultIds[0]}`)
        .send({
          salary: 12345,
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "Manager",
          salary: 12345,
          equity: '0.010',
          companyHandle: 'c1'
        },
      });
    });

    test("admin not found on no such job", async function () {
      const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });

    test("admin bad request on id change attempt", async function () {
      const resp = await request(app)
        .patch(`/jobs/${jobResultIds[0]}`)
        .send({
          id: 234,
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

    test("admin bad request on invalid data", async function () {
      const resp = await request(app)
        .patch(`/jobs/${jobResultIds[0]}`)
        .send({
          salary: "9999999",
        })
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(400);
    });

  });
  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("user unauth: fail", async function () {
      const resp = await request(app)
        .patch(`/jobs/${jobResultIds[0]}`)
        .send({
          title: "Boss",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 },
      });
    });

    test("user unauth: not found on no such job", async function () {
      const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          salary: 9999999,
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("user unauth: bad request on invalid data", async function () {
      const resp = await request(app)
        .patch(`/jobs/${jobResultIds[0]}`)
        .send({
          companyHandle: "newc",
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

    test("user unauth: bad request on id change attempt", async function () {
      const resp = await request(app)
        .patch(`/jobs/c1`)
        .send({
          id: 999,
        })
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });

  });

  /************************************** anon tests */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/jobs/${jobResultIds[0]}`)
      .send({
        title: "CEO",
      });
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:id", function () {
  /************************************** admin tests */
  describe("admin test", function () {
    test("works for admin", async function () {
      const resp = await request(app)
        .delete(`/jobs/${jobResultIds[0]}`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.body).toEqual({ deleted: `${jobResultIds[0]}` });
    });

    test("admin not found for no such company", async function () {
      const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u4Token}`);
      expect(resp.statusCode).toEqual(404);
    });

  });

  /************************************** non-admin user tests */
  describe("non-admin user test", function () {
    test("unauth for users", async function () {
      const resp = await request(app)
        .delete(`/jobs/${jobResultIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.body).toEqual({
        error: { message: "Unauthorized", status: 401 },
      });
    });

    test("user unauth: not found for no such company", async function () {
      const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u1Token}`);
      expect(resp.statusCode).toEqual(401);
    });
  });

  /************************************** anon user tests */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/jobs/${jobResultIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

});
