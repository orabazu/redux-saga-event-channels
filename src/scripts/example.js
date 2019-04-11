/* eslint-disable no-unused-vars */
// Imports for all relevant modules not shown to save space
import { runSaga, eventChannel, stdChannel } from 'redux-saga';
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
} from 'redux-saga/effects';
import EventEmitter from 'events';

const createSagaIO = (emitter, getStateResolve) => {
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

function createChannel() {
  return eventChannel((emit) => {
    let counter = 0;
    const id = setInterval(() => {
      emit(counter += 1);
    }, 1000);

    return () => clearInterval(id);
  });
}

function* putReceipt() {
  yield delay(1000);
  yield put({ type: 'RECEIPT' });
}

function* someSaga() {
  const chan = yield call(createChannel);
  try {
    while (true) {
      const received = yield take(chan);

      yield fork(putReceipt);

      const { response, timeout } = yield race({
        response: take('*'),
        timeout: delay(5000),
      });
      if (response) {
        console.log('look im here!', response);
      }
    }
  } finally {
    if (yield cancelled()) {
      chan.close();
    }
  }
}

const emitter = new EventEmitter();
runSaga(createSagaIO(emitter, () => state), someSaga);
