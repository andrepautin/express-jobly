"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  jobResult1Id
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "Baby Sitter",
    salary: 25000,
    equity: 0,
    companyHandle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    let id = job.id;

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE handle = $1`, [id]);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "Baby Sitter",
        salary: 25000,
        equity: 0,
        company_handle: 'c1'
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Manager",
        salary: 10000,
        equity: 0.010,
        company_handle: 'c1'
      },
      {
        id: expect.any(Number),
        title: "Receptionist",
        salary: 20000,
        equity: 0.020,
        company_handle: 'c2'
      },
      {
        id: expect.any(Number),
        title: "Custodian",
        salary: 30000,
        equity: 0.030,
        company_handle: 'c3'
      },
    ]);
  });

  // test("works for single filter by name", async function() {
  //   let companies = await Company.findAll({name: "1"});
  //   expect(companies).toEqual(
  //     [{
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     }]
  //   )
  // });

  // test("works for case-insensitive name", async function() {
  //   let companies = await Company.findAll({name: "c"});
  //   expect(companies).toEqual(
  //     [{
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     },
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //     },
  //     {
  //       handle: "c3",
  //       name: "C3",
  //       description: "Desc3",
  //       numEmployees: 3,
  //       logoUrl: "http://c3.img",
  //   }]);
  // });

  // test("works for multiple filters", async function() {
  //   let filters = {minEmployees: "1", maxEmployees: "2"};
  //   let companies = await Company.findAll(filters);
  //   expect(companies).toEqual(
  //     [{
  //       handle: "c1",
  //       name: "C1",
  //       description: "Desc1",
  //       numEmployees: 1,
  //       logoUrl: "http://c1.img",
  //     },
  //     {
  //       handle: "c2",
  //       name: "C2",
  //       description: "Desc2",
  //       numEmployees: 2,
  //       logoUrl: "http://c2.img",
  //   }]);
  // });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    // TODO: need to find out how to get ids to use here
    let job = await Job.get(jobResult1Id);
    expect(job).toEqual({
      id: jobResult1Id,
      title: "Manager",
      salary: 10000,
      equity: 0.010,
      company_handle: 'c1'
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Associate",
    salary: 5000,
    equity: 0.020,
  };

  test("works", async function () {
    let job = await Job.update(jobResult1Id, updateData);
    expect(job).toEqual({
      id: jobResult1Id,
      ...updateData,
      company_handle: 'c1'
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = $1`, 
           [jobResult1Id]);
    expect(result.rows).toEqual([{
      id: jobResult1Id,
      title: "Associate",
      salary: 5000,
      equity: '0.020',
      company_handle: 'c1'
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "Associate",
      salary: null,
      equity: null,
    };

    let job = await Job.update(jobResult1Id, updateDataSetNulls);
    expect(job).toEqual({
      id: jobResult1Id,
      ...updateDataSetNulls,
      company_handle: 'c1'
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE id = $1`, 
       [jobResult1Id]);
      expect(result.rows).toEqual([{
        id: jobResult1Id,
        title: "Associate",
        salary: 10000,
        equity: '0.010',
        company_handle: 'c1'
      }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(0, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(jobResult1Id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [jobResult1Id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** filter method */

// describe("sql filter maker", function () {
//   test("valid correct statement", function(){
//     let filters = {name: "cho", minEmployees: 3, maxEmployees: 5};
//     let query = Company._sqlForCompanyFilterSearch(filters);

//     expect(query).toEqual({whereExpression:" WHERE name ILIKE $1 AND num_employees >= $2 AND num_employees <= $3",
//      values:["%cho%", 3, 5]})
//   });

//   test("valid two min/max filter", function (){
//     let filters = {minEmployees: 3, maxEmployees: 5};
//     let query = Company._sqlForCompanyFilterSearch(filters);

//     expect(query).toEqual({whereExpression:" WHERE num_employees >= $1 AND num_employees <= $2",
//     values:[3, 5]});
//   });

//   test("valid min and name output", function(){
//     let filters = {minEmployees: 3, name: "cho"};
//     let query = Company._sqlForCompanyFilterSearch(filters);

//     expect(query).toEqual({whereExpression:" WHERE name ILIKE $1 AND num_employees >= $2",
//     values:["%cho%", 3]});
//   });

//   test("empty filter", function(){
//     //scenario => our if statement not working
//     let filters = {};
//     let query = Company._sqlForCompanyFilterSearch(filters);

//     expect(query).toEqual({"values": [], "whereExpression": ""});
//   })
// })