require('dotenv').config({ path: 'variables.env' });
const mongoose = require('mongoose');
const Student = require('../models/Student');
const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');
const request = require('supertest');
const serverRequestToScraper = require('request');
const scraper = require('../helpers/scraper');
const assert = require('assert');
const app = require('../app');

const sandbox = sinon.sandbox.create();

afterEach(function() {
  sandbox.restore();
});

describe('POST /add_student', () => {

  before(function (done) {
    // Connect to the Database
    mongoose.connect(process.env.DATABASE, {
      useMongoClient: true
    });

    joseph = new Student({
      name: 'Joseph',
      email: 'user@freecodecamp.com',
      username: 'imcodingideas'
    });

    mongoose.Promise = global.Promise;
    mongoose.connection.on('error', (err) => {
      console.error(`🙅 🚫 → ${err.message}`);
    });

    mongoose.connection.once('open', function() {
      console.log('We are connected to test database!');
      done();
    });
  });

  it('should return an error if student name is absent', done => {
    request(app)
      .post('/add_student')
      .end(function(_err, res) {
        expect(res.statusCode).to.equal(422);
        expect(JSON.parse(res.text).errors).to.include('Name is required.');
        expect(JSON.parse(res.text).errors).to.include('Email is required.');
        expect(JSON.parse(res.text).errors).to.include('Username is required.');
        done();
      });
  });

  it('should return an error if email in invalid', done => {
    request(app)
      .post('/add_student')
      .send({ email: 'userfreecodecampcom' })
      .end(function(_err, res) {
        expect(res.statusCode).to.equal(422);
        expect(JSON.parse(res.text).errors).to.include('Email is invalid.');
        done();
      });
  });

  it('should receive an error message if scraper returns error,', done => {
    let fetchUserInfoFromFCC = sandbox.stub(scraper, 'fetchUserInfoFromFCC');
    fetchUserInfoFromFCC.yields(true, '{}');

    request(app)
      .post('/add_student')
      .send({
        name: 'fccStudent',
        email: 'user@freecodecamp.com',
        username: 'invalidUsername'
      })
      .end(function(_err, res) {
        expect(res.statusCode).to.equal(422);
        expect(JSON.parse(res.text).errors).to.include(
          'freeCodeCamp username is invalid.'
        );
        done();
      });
  });

  it('should find a Student by username', done => {
    Student.findOne({ username: 'imcodingideas' })
      .then(foundStudent => {
        assert(foundStudent.name === 'Joseph Chambers')
        done()
      })
  });

  xit('should call the mongoose save method when all fields are valid', done => {
    let fetchUserInfoFromFCC = sandbox.stub(scraper, 'fetchUserInfoFromFCC');
    fetchUserInfoFromFCC.yields(false, '{}');
    let save = sandbox.stub(Student.save());
    save.yields(false);

    request(app)
      .post('/add_student')
      .send({
        name: 'fccStudent',
        email: 'user@freecodecamp.com',
        username: 'anyusername'
      })
      .end(function(_err, res) {
        expect(res.statusCode).to.equal(200);
        expect(save).to.have.been.calledOnce;
        done();
      });
  });

  xit('should not call the mongoose save method when username is invalid', done => {
    let fetchUserInfoFromFCC = sandbox.stub(scraper, 'fetchUserInfoFromFCC');
    fetchUserInfoFromFCC.yields(true, '{}');
    let save = sandbox.stub(Student.prototype, 'save');
    save.yields(false);

    request(app)
      .post('/add_student')
      .send({
        name: 'fccStudent',
        email: 'user@freecodecamp.com',
        username: 'invalidusername'
      })
      .end(function(_err, res) {
        expect(res.statusCode).to.equal(422);
        expect(JSON.parse(res.text).errors).to.include(
          'freeCodeCamp username is invalid.'
        );
        expect(save).to.not.have.been.called;
        done();
      });
  });

  // FIXME: Intended to test if we were able to save completedChallengesCount and completedChallengesTitle
  // to db but unit test might not serve the purpose
  xit('should save completedChallengesCount and completedChallengesTitle when saving students', done => {
    let student = {
      _id: '5a9f752384675412f4cac45b',
      name: 'tom',
      username: 'user512',
      email: 'user@freecodecamp.com',
      notes: '',
      __v: 0,
      daysInactive: 3,
      completedChallengesCount: 2,
      completedChallenges: [
        {
          title: 'Build a Tribute Page',
          completed_at: 'Apr 02, 2017',
          updated_at: '',
          url: 'https://www.freecodecamp.com/challenges/Build a Tribute Page'
        },
        {
          title: 'Reverse a String',
          completed_at: 'May 13, 2017',
          updated_at: '',
          url: 'https://www.freecodecamp.comundefined'
        }
      ]
    };

    var fetchUserInfoFromFCC = sandbox.stub(scraper, 'fetchUserInfoFromFCC');
    fetchUserInfoFromFCC.yields(false, student);
    let save = sandbox.stub(Student.prototype, 'save');
    save.yields(false);

    var StudentClass = (exports.Student = Student);
    var studentConstructor = sinon.spy(exports, 'Student');

    request(app)
      .post('/add_student')
      .send({
        name: 'tom',
        email: 'user@freecodecamp.com',
        username: 'user512'
      })
      .end(function(_err, res) {
        expect(res.statusCode).to.equal(200);
        expect(studentConstructor.called).to.equal(true);
        expect(save).to.have.been.calledOnce;
        done();
      });
  });
});
