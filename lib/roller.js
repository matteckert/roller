module.exports = exports = function() {
    if (typeof arguments[0] === 'number') {
        if (typeof arguments[1] === 'number') {
            return leafRoller.create(arguments[0], arguments[1], []);
        }
        return leafRoller.create(1, arguments[0], []);
    }
    return compositeRoller.create(makeArray(arguments.length, function(i) {
        if (this[i].roll) return this[i];
    }, arguments), []);
};

var transformer = {
    transformations: [],
    transform: function(value) {
        return this.transformations.reduce(function(previous, current) {
            return current(previous);
        }, value);
    }
};

var transformations = {
    sum: function(n) {
        return function(value) {
            if (Array.isArray(value)) {
                value = value.reduce(function (previous, current) {
                    return previous + current;
                }, 0);
            }
            return value + (n || 0);
        };
    },
    count: function(n) {
        return function(value) {
            if (Array.isArray(value)) {
                return value.reduce(function(previous, current) {
                    return current >= n ? previous + 1 : previous;
                }, 0);
            }
            return value >= n ? 1 : 0;
        };
    },
    high: function(n) {
        return function(value) {
            return value.sort(descending).slice(0, n);
        };
    },
    low: function(n) {
        return function(value) {
            return value.sort(descending).slice(-n);
        };
    },
    explode: function(n) {
        var sides = this.sides;
        return function(value) {
            value.forEach(function (value, i, array) {
                while (value >= n && array.length < 100) {
                    value = roll(sides);
                    array.push(value);
                }
            });
            return value;
        };
    }
};

var leafRoller = addFactory(extend({
    number: 1,
    sides: 6,
    roll: function() {
        return this.transform(makeFlatArray(this.number, function(i, array) {
            return roll(this.sides);
        }, this));
    }
}, transformer), 'number', 'sides', 'transformations');

Object.keys(transformations).forEach(function(key) {
    leafRoller[key] = function() {
        return leafRoller.create(this.number, this.sides,
            this.transformations.concat(transformations[key].apply(this, arguments)));
    };
});

var compositeRoller = addFactory(extend({
    rollers: [],
    roll: function() {
        return this.transform(makeFlatArray(this.rollers.length, function(i) {
            return this.rollers[i].roll();
        }, this));
    },
    sum: function(n) {
        return compositeRoller.create(this.rollers.map(function(roller) {
            return roller.sum(n);
        }), this.transformations.concat(transformations.sum.apply(n)));
    },
    count: function(n) {
        return compositeRoller.create(this.rollers.map(function(roller) {
            return roller.count(n);
        }), this.transformations.concat(transformations.sum.apply(n)));
    }
}, transformer), 'rollers', 'transformations');

function descending(a, b) {
    return b - a;
}

function roll(s) {
    return Array.isArray(s) ? s[randomInt(s.length)] : randomInt(s) + 1;
}

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function extend(object) {
    var propertyObjects = [].slice.call(arguments, 1);
    var i;
    for (i = 0; i < propertyObjects.length; i++) {
        for (var property in propertyObjects[i]) {
            object[property] = propertyObjects[i][property];
        }
    }
    return object;
}

function makeArray(length, callback, thisArg) {
    var array = [];
    var i;
    thisArg = thisArg || void 0;
    var currentValue;
    for (i = 0; i < length; i++) {
        currentValue = callback.call(thisArg, i, array);
        if (currentValue !== undefined) {
            array.push(currentValue);
        }
    }
    return array;
}

function makeFlatArray(length, callback, thisArg) {
    var array = makeArray(length, callback, thisArg);
    return array.length === 1 ? array[0] : array;
}

function addFactory(thisArg) {
    var outerArgs = [].slice.call(arguments, 1);
    thisArg.create = function() {
        var created = Object.create(thisArg);
        [].forEach.call(arguments, function(arg, i) {
            created[outerArgs[i]] = arg;
        });
        return created;
    };
    return thisArg;
}
