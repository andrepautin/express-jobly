"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureAdminOrCorrectUser,
} = require("./auth");


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


/************************************** authenticateJWT */

describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});

/************************************** ensureLoggedIn */

describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });
});

/************************************** ensureAdmin */

describe("ensureAdmin", function(){
  test("works", function(){
    expect.assertions(1);
    const req = {};
    const res = {locals: {user: {username: "testAdmin", isAdmin: true}}};
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdmin(req, res, next);
  });

  test("fails not admin", function(){
    expect.assertions(1);
    const req = {};
    const res = {locals: {user: {username: "test", isAdmin: false}}};
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdmin(req, res, next);
  })

  test("fails isAdmin incorrect type", function(){
    expect.assertions(1);
    const req = {};
    const res = {locals: {user: {username: "test", isAdmin: "asjkfa"}}};
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdmin(req, res, next);
  })
})

/************************************** ensureAdminOrCorrectUser */

describe("ensureAdminOrCorrectUser", function() {
  test("works for admin", function() {
    expect.assertions(1);
    const req = {params: {username: "test"}};
    const res = {locals: {user: {username: "testAdmin", isAdmin: true}}};
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrCorrectUser(req, res, next);
  });
  
  test("works for user", function() {
    expect.assertions(1);
    const req = {params: {username: "test"}};
    const res = {locals: {user: {username: "test", isAdmin: false}}};
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureAdminOrCorrectUser(req, res, next);
  });

  test("fails for non-admin or incorrect user", function() {
    expect.assertions(1);
    const req = {params: {username: "test"}};
    const res = {locals: {user: {username: "test2", isAdmin: false}}};
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdminOrCorrectUser(req, res, next);
  });

  test("fails isAdmin incorrect type", function(){
    expect.assertions(1);
    const req = {params: {username: "test2"}};
    const res = {locals: {user: {username: "test", isAdmin: "asjfka"}}};
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureAdminOrCorrectUser(req, res, next);
  })
});
