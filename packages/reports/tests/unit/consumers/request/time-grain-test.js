import { set } from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { RequestActions } from 'navi-reports/services/request-action-dispatcher';

module('Unit | Consumer | request time grain', function(hooks) {
  setupTest(hooks);

  test('ADD_TIME_GRAIN', function(assert) {
    assert.expect(5);

    const MockDispatcher = {
      dispatch(action, route, timeGrain) {
        assert.equal(
          action,
          RequestActions.DID_UPDATE_TIME_GRAIN,
          'DID_UPDATE_TIME_GRAIN is sent after ADD_TIME_GRAIN has made a change'
        );

        assert.deepEqual(timeGrain, { id: 'newTimeGrain' }, 'New time grain value is given to action');

        assert.step('sent only once');
      }
    };

    let logicalTable = { timeGrain: 'oldTimeGrain' },
      currentModel = { request: { logicalTable } },
      consumer = this.owner
        .factoryFor('consumer:request/time-grain')
        .create({ requestActionDispatcher: MockDispatcher });

    consumer.send(RequestActions.ADD_TIME_GRAIN, { currentModel }, { id: 'newTimeGrain' });

    assert.equal(logicalTable.timeGrain, 'newTimeGrain', 'addTimeGrain updates the timeGrain in the currentModel');

    consumer.send(RequestActions.ADD_TIME_GRAIN, { currentModel }, { id: 'newTimeGrain' });

    assert.verifySteps(['sent only once'], 'DID_UPDATE_TIME_GRAIN is not sent if time grain is not changed');
  });

  test('REMOVE_TIME_GRAIN', function(assert) {
    assert.expect(4);

    const MockDispatcher = {
      dispatch(action, route, timeGrain) {
        assert.equal(
          action,
          RequestActions.DID_UPDATE_TIME_GRAIN,
          'DID_UPDATE_TIME_GRAIN is sent after REMOVE_TIME_GRAIN has set time grain to `All`'
        );

        assert.equal(timeGrain.id, 'all', 'New time grain value is given to action');
      }
    };

    let tableWithAll = { timeGrains: [{ id: 'all' }] },
      tableWithoutAll = { timeGrains: [] },
      logicalTable = { table: tableWithAll },
      currentModel = { request: { logicalTable } },
      consumer = this.owner
        .factoryFor('consumer:request/time-grain')
        .create({ requestActionDispatcher: MockDispatcher });

    //remove time grain from a table with all
    consumer.send(RequestActions.REMOVE_TIME_GRAIN, { currentModel });

    assert.equal(
      logicalTable.timeGrain,
      'all',
      'removeTimeGrain updates the timeGrain to all when table has the all timeGrain'
    );

    //remove time grain from a table without all
    MockDispatcher.dispatch = () => {
      throw new Error('DID_UPDATE_TIME_GRAIN should not be called when REMOVE_TIME_GRAIN makes no change');
    };
    set(logicalTable, 'table', tableWithoutAll);
    set(logicalTable, 'timeGrain', 'week');
    consumer.send(RequestActions.REMOVE_TIME_GRAIN, { currentModel });

    assert.equal(
      logicalTable.timeGrain,
      'week',
      'removeTimeGrain does not update the timeGrain when table does not have the all timeGrain'
    );
  });
});
