'use strict';

const test = require('tape');
const sinon = require('../sinon');

require('css-modules-require-hook/preset');

global.window = {
    addEventListener: sinon.stub(),
};

const mock = require('mock-require');

const connect = sinon.stub().returns({
    on: sinon.stub(),
});

const Terminal = sinon.stub().returns({
    open: sinon.stub(),
    fit: sinon.stub(),
    on: sinon.stub(),
    writeln: sinon.stub(),
    setOption: sinon.stub(),
    proposeGeometry: sinon.stub().returns({
        cols: 80,
        rows: 25,
    }),
});

mock('socket.io-client/dist/socket.io.min', {
    connect,
});

mock('xterm/dist/xterm', Terminal);

const gritty = require('../../client/gritty');
const {
    _onConnect,
    _onDisconnect,
    _onData,
    _onTermResize,
    _onTermData,
    _onWindowResize,
} = require('../../client/gritty');

test('gritty: Terminal: new', (t) => {
    before();
    
    gritty();
    t.ok(Terminal.calledWithNew(), 'should have been called with new');
    after();
    
    t.end();
});

test('gritty: Terminal: args', (t) => {
    before();
    const args = {
        scrollback: 1000,
        tabStopWidth: 4,
        theme: 'gritty',
    };
    
    gritty();
    
    t.ok(Terminal.calledWith(args), 'should have been called with args');
    
    after();
    t.end();
});

test('gritty: onConnect: blink', (t) => {
    const blink = sinon.stub();
    const socket = {
        emit: sinon.stub()
    };
    
    _onConnect(blink, socket, {});
    t.ok(blink.calledWith(true), 'should call blink');
    t.end();
});

test('gritty: onConnect: socket: resize', (t) => {
    const blink = sinon.stub();
    const emit = sinon.stub();
    const socket = {
        emit
    };
    
    const options = {
        cols: 80,
        rows: 25,
    };
    _onConnect(blink, socket, options);
    
    t.ok(emit.calledWith('resize', options), 'should call emit');
    t.end();
});

test('gritty: onConnect: socket: terminal', (t) => {
    const blink = sinon.stub();
    const emit = sinon.stub();
    const socket = {
        emit: (...args) => {
            emit(...args);
            socket.emit = sinon.stub();
        }
    };
    
    const options = {
        env: {
            hello: 'world'
        },
        cols: 80,
        rows: 25,
    };
    _onConnect(blink, socket, options);
    
    t.ok(emit.calledWith('terminal', options), 'should call emit');
    t.end();
});

test('gritty: onDisconnect: blink', (t) => {
    const blink = sinon.stub();
    const writeln = sinon.stub();
    
    _onDisconnect(blink, {writeln});
    t.ok(blink.calledWith(false), 'should call blink');
    t.end();
});

test('gritty: onDisconnect: terminal', (t) => {
    const blink = sinon.stub();
    const writeln = sinon.stub();
    
    const msg = 'terminal disconnected...';
    
    _onDisconnect(blink, {writeln});
    t.ok(writeln.calledWith(msg), 'should call terminal.writeln');
    t.end();
});

test('gritty: onData: terminal', (t) => {
    const blink = sinon.stub();
    const write = sinon.stub();
    
    const data = 'hello';
    
    _onData({write}, data);
    t.ok(write.calledWith(data), 'should call terminal.write');
    t.end();
});

test('gritty: onTermResize: socket', (t) => {
    const emit = sinon.stub();
    
    const size = {
        cols: 80,
        rows: 25,
    };
    
    _onTermResize({emit}, size);
    t.ok(emit.calledWith('resize', size), 'should call socket.emit');
    t.end();
});

test('gritty: onTermData: socket', (t) => {
    const emit = sinon.stub();
    
    const data = 'hello';
    
    _onTermData({emit}, data);
    t.ok(emit.calledWith('data', data), 'should call socket.emit');
    t.end();
});

test('gritty: onWindowResize: terminal', (t) => {
    const fit = sinon.stub();
    
    _onWindowResize({fit});
    
    t.ok(fit.calledWith(), 'should call terminal.fit');
    t.end();
});

function before() {
    global.location = {};
}

function after() {
    delete global.location;
}
