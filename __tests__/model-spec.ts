import { Model, IReport } from '../src/model';
import moment from 'moment';
import _ from 'lodash';

test('Should initialize', () => {
  const model = new Model<number>("test", d => _.sum(d), (table, id) => Promise.resolve(0));
  expect(model.name).toBe("test");
});

test('Should report realtime', async () => {
  const model = new Model<number>("test", d => _.sum(d), (table, id) => Promise.resolve(0));
  const reports = await model.report(233, moment(Date.now()));
  expect(reports[0].data).toBe(233);
  expect(reports[0].table).toBe("second");
});

test('Should access querier', async () => {
  let called = false;
  const model = new Model<number>("test", d => _.sum(d), (table, id) => {
    called = true;
    return Promise.resolve(0);
  });
  const reports = await model.report(233, moment(Date.now()));
  expect(called).toBe(true);
});

test('Should report various forms of data', async () => {
  const model = new Model<number>("test", d => _.sum(d), (table, id) => Promise.resolve(0));
  const reports = await model.report(233, moment(Date.now()));
  expect(reports[0].data).toBe(233);
  expect(reports[1].data).toBe(233);
});


test('Should have sum when first reported and not reject', async () => {
  const model = new Model<number>("test", d => {
    expect(_.size(d)).toBe(1);
    return _.sum(d);
  }, (table, id) => Promise.resolve(null));
  const reports = await model.report(233, moment(Date.now()));
});

test('Should report correct data in timezone', async() => {
  const data: any = {};
  const model = new Model<string>("test", d => d.join(","), (table, id) => Promise.resolve(data && data[table] && data[table][id]));
  const pushData = (result: Array<IReport<string>>) => result.forEach(v => {
    if (!(v.table in data)) {
      data[v.table] = {};
    }
    data[v.table][v.id] = v.data;
  });
  pushData(await model.report("1", moment("2018/08/01 09:01:00")));
  pushData(await model.report("2", moment("2018/07/03 10:03:04")));
  pushData(await model.report("3", moment("2018/08/01 09:01:01")));
  pushData(await model.report("4", moment("2018/08/01 09:02:01")));
  pushData(await model.report("5", moment("2018/08/01 09:20:03")));
  pushData(await model.report("6", moment("2018/08/01 10:01:02")));
  pushData(await model.report("7", moment("2018/08/02 10:02:03")));
  expect(data).toMatchObject({"day": {"1530547200": "2", "1533052800": "1,3,4,5,6", "1533139200": "7"}, "hour": {"1530583200": "2", "1533085200": "1,3,4,5", "1533088800": "6", "1533175200": "7"}, "minute": {"1530583380": "2", "1533085260": "1,3", "1533085320": "4", "1533086400": "5", "1533088860": "6", "1533175320": "7"}, "month": {"1530374400": "2", "1533052800": "1,3,4,5,6,7"}, "second": {"1530583384": "2", "1533085260": "1", "1533085261": "3", "1533085321": "4", "1533086403": "5", "1533088862": "6", "1533175323": "7"}});
});