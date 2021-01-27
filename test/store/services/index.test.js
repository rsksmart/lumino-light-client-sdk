import * as services from "../../../src/store/epics/services";

import { LocalStorageHandler } from "../../../src";
import { Observable } from "rxjs";
import Store from "../../../src/store";
import client from "../../../src/apiRest";
import notifierGet from "../../../src/notifierRest";
import { take } from "rxjs/operators";

describe("testing services", () => {
  const initStoreWithData = async data => {
    LocalStorageHandler.saveLuminoData(data);
    await Store.initStore(LocalStorageHandler, {});
  };

  test("should return observable of payment messages", async () => {
    const state = {
      client: {},
    };
    await initStoreWithData(state);
    const response = services.getTransactionInfo();
    expect(response).toBeInstanceOf(Observable);
  });

  test("request should return an array of messages", async () => {
    const url = "light_client_messages";
    client.get.mockImplementationOnce(() => Promise.resolve({ data: [] }));
    const res = await services.requestMessages(url, 1);
    expect(res).toStrictEqual([]);
  });

  test("request notifications should return empty notification", async () => {
    notifierGet.get.mockImplementation(() => new Promise(res => res([])));
    const state = {
      notifier: {
        notifiers: {
          123: {
            apiKey: 123,
            topics: { 75: 75, 76: 76 },

            url: "123",
            fromNotificationId: 234,
          },
          321: {
            apiKey: 123,
            topics: { 75: 75, 76: 76 },

            url: "321",
            fromNotificationId: 234,
          },
          1223: {
            apiKey: 123,
            topics: { 75: 75, 76: 76 },
            url: "1223",
            fromNotificationId: 234,
          },
        },
      },
    };
    await initStoreWithData(state);
    const result = services.getNotificationsInfo();
    expect(result).toBeInstanceOf(Observable);

    // Check observable
    result.pipe(take(3)).subscribe(val => {
      expect(val.errors).toStrictEqual([]);
      expect(val.fulfilled.length).toBe(3);
      expect(val.fulfilled[0]).toStrictEqual({
        status: "fulfilled",
        value: [],
      });
    });

    notifierGet.get.mockReset();
  });
});
