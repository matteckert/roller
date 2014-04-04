require('should');

var roller = require('../lib/roller.js');

describe('roller', function() {
    describe('with one die', function() {
        it('returns a number', function() {
            roller(1,6).roll().should.be.a.Number;
        });

        it('is in range', function() {
            roller(1,6).roll().should.be.within(1, 6);
        });

        it('can be specified by one number (sides)', function() {
            roller(2).roll().should.be.within(1, 2);
        });

        it('can handle an array of dice faces', function() {
            roller([-1, 0, 1]).roll().should.be.within(-1, 1);
        });
    });

    describe('with multiple dice', function() {
        it('returns an array', function() {
            roller(2,8).roll().should.be.an.Array;
        });

        it('is in range', function() {
            var r = roller(2, 8).roll();
            r[0].should.be.within(1, 8);
            r[1].should.be.within(1, 8);
        });

        it('can get the high results', function() {
            roller(4,6).high(3).roll().length.should.equal(3);
        });

        it('can get the low results', function() {
            roller(4,6).low(2).roll().length.should.equal(2);
        });

        it('can explode the dice', function() {
            roller(4,6).explode().roll().length.should.be.above(3);
        });

        it('has an explode limit', function() {
            roller(4,6).explode(1).roll().length.should.equal(100);
        });
    });

    describe('with multiple rollers', function() {
        it('returns an array if single dice combined', function() {
            roller(roller(1,6), roller(1,6)).roll().should.be.an.Array;
        });

        it('returns an array of array if more than one die', function() {
            roller(roller(2,6), roller(1,6)).roll()[0].should.be.an.Array;
        });

        it('can sum all the dice', function() {
            roller(roller(2,6), roller(1,6)).sum().roll().should.be.within(3, 18);
        });
    });
});

