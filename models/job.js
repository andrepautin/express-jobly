"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = $1 AND salary = $2 AND equity = $3 AND company_handle = $4`,
      [title, salary, equity, companyHandle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${duplicateCheck.rows[0].id} ${title}`);

    const result = await db.query(
      `INSERT INTO jobs (
          title,
          salary,
          equity,
          company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [
        title,
        salary,
        equity,
        companyHandle,
      ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all companies. 
   * If filters provided finds all companies matching filters
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */
  //TODO: fix filter function
  static async findAll(filters = {}) {
    console.log("FILTERS--->", filters);
    let baseQuery = `SELECT id,
                            title,
                            salary,
                            equity,
                            company_handle AS "companyHandle"
                            FROM jobs`
    // console.log("model filters!", filters)
    // const { whereExpression, values } = Company._sqlForCompanyFilterSearch(filters);
    // if (whereExpression !== "") {
    //   baseQuery += whereExpression;
    // }
    baseQuery += " ORDER BY id";
    // console.log("model post function", queryFilter)  
    console.log("BASE QUERY--->", baseQuery);
    const allJobs = await db.query(baseQuery);
    return allJobs.rows;
  }
  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *   where companyHandle is [{ handle, name, description, numEmployees, logoUrl }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
                title,
                salary,
                equity,
                company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        companyHandle: "company_handle",
      });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
      UPDATE jobs
      SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
      [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);
  }

  // ========================== HELPER FUNCTIONS ======================
  /** Used for company filtering sql, pass in filter data 
 * and it will return an object containing the sql query statement
 * and the values to be passed in when using db.query
 * 
 * e.g {name:"No", minEmployees:"2", maxEmployees:"3"} 
 * ==> {whereCols:'name ILIKE $1 AND num_employees >= min AND max >= num_employees',
 *  values: '%No%'}
 * 
 * e.g {name:"no", maxEmployees: "3"} 
 * ==> {whereCols: 'name ILIKE $1 AND 3 >= num_employee
 *  values: '%no%'}
 * 
 */
  //TODO: find better way to return only needed data/ move to model as method (rename with _sql... to signal internal use)
  //(b/c it affects others using this function)
//   static _sqlForCompanyFilterSearch(filterData) {

//     // console.log("filter ran! filter Data =>", filterData)
//     const { name, minEmployees, maxEmployees } = filterData; //["name", "minEmployees", "maxEmployees"]
//     let values = [];
//     let whereClauses = [];
//     let whereExpression = ""

//     if (name) {
//       values.push(`%${name}%`);
//       whereClauses.push(`name ILIKE $${values.length}`);
//     };

//     if (minEmployees) {
//       values.push(minEmployees);
//       whereClauses.push(`num_employees >= $${values.length}`);
//     };

//     if (maxEmployees) {
//       values.push(maxEmployees)
//       whereClauses.push(`num_employees <= $${values.length}`);
//     }

//     if (whereClauses.length > 0) {
//       whereExpression = " WHERE " + whereClauses.join(" AND ");
//     }
//     return { whereExpression, values };
//   }
}


module.exports = Job;
