/* eslint-disable no-unused-vars */
// Imports for all relevant modules not shown to save space
import { runSaga, stdChannel, eventChannel } from 'redux-saga';
import {
  delay,
  call,
  takeEvery,
  select,
  cancelled,
  take,
  race,
  fork,
  put,
  all,
} from 'redux-saga/effects';
import EventEmitter from 'events';

const getSagaOptions = (emitter) => {
  const channel = stdChannel();
  emitter.on('action', channel.put);

  return {
    channel,
    dispatch: (output) => {
      emitter.emit('action', output);
    },
    getState: () => {
      'sampleValue';
    },
  };
};

const emitter = new EventEmitter();
const sagaOpts = getSagaOptions(emitter);


function createEventChannel() {
  return eventChannel((emit) => {
    fetch('https://jsonplaceholder.typicode.com/todos/1')
      .then(response => response.json())
      .then((myJson) => {
        emit(myJson);
      });

    return () => false;
  });
}

function createButtonClickEventChannel() {
  return eventChannel((emit) => {
    let counter = 1;
    document.getElementById('incrementAsync')
      .addEventListener('click', () => {
        counter += 1;
        fetch(`https://jsonplaceholder.typicode.com/todos/${counter}`)
          .then(response => response.json())
          .then((myJson) => {
            emit(myJson);
          });
      });
    return () => false;
  });
}

function* complexOperationFilterData(userData) {
  yield delay(500);
  const filtered = userData.title;
  yield filtered;
  return filtered;
}

function* renderTitle(title) {
  const valueEl = document.getElementById('title');
  yield valueEl.innerHTML = title;
  console.log('Title Rendered::', title);
}

function* watchEventChannel() {
  yield delay(1000);
  const chan = yield call(createEventChannel);
  try {
    while (true) {
      const received = yield take(chan);
      console.log('FROM API::', received);
      const title = yield* complexOperationFilterData(received);
      console.log('Title From Another SAGA::', title);
      yield* renderTitle(title);
    }
  } finally {
    if (yield cancelled()) {
      chan.close();
      console.log('Channel terminated');
    }
  }
}

function* watchOnClickEventChannel() {
  const chan = yield call(createButtonClickEventChannel);
  try {
    while (true) {
      const received = yield take(chan);
      console.log('Data from api by button click::', received);
      const title = yield* complexOperationFilterData(received);
      console.log('Title From Another SAGA::', title);
      yield* renderTitle(title);
    }
  } finally {
    if (yield cancelled()) {
      chan.close();
      console.log('Channel terminated');
    }
  }
}

function* rootSaga() {
  yield all([
    watchOnClickEventChannel(),
    watchEventChannel(),
  ]);
}

runSaga(sagaOpts, rootSaga);
