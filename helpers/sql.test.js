const { sqlForPartialUpdate } = require("./sql");

describe("makes sql query string and values object", function(){
  test("simple correct data", function(){
    const data = {firstName: "Mary", 
                  lastName:"Jane", 
                  email:"newMail@mail.com"};

    const jsToSql = {firstName: "first_name", 
                      lastName: "last_name", 
                      isAdmin: "is_admin"};

    const result = sqlForPartialUpdate(data, jsToSql);
    expect(result).toEqual({setCols:'"first_name"=$1, "last_name"=$2, "email"=$3',
                            values:["Mary", "Jane", "newMail@mail.com"]})
  });

  test("no data object passed - error", function(){
    const data = {};
    const jsToSql = {firstName: "first_name", 
                      lastName: "last_name", 
                      isAdmin: "is_admin"};

    expect(function(){(sqlForPartialUpdate(data, jsToSql))})
          .toThrow("No data");    
  });
})