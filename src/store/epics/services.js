import {of} from "rxjs";
import fakePaymentData from "./tmpFakeData";
import {delay} from "rxjs/operators";

const ENDPOINT = '/api/payments_light';

const getTransactionInfo = () => {
    // restful url is not ready yet.

    // return ajax({
    //     url: ENDPOINT,
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'rxjs-custom-header': 'Rxjs'
    //     },
    //     body: {
    //         payments
    //     }
    // })

    return of([...fakePaymentData]).pipe(delay(350))
};

export {
    getTransactionInfo
}