var braintree = require('braintree');
const { Router } = require('express');
const { Transaction } = require('braintree');
const logger = require('debug');
const gateway = require('../lib/gateway.js');

const router = Router(); // eslint-disable-line new-cap
const debug = logger('braintree_example:router');
const TRANSACTION_SUCCESS_STATUSES = [
  Transaction.Status.Authorizing,
  Transaction.Status.Authorized,
  Transaction.Status.Settled,
  Transaction.Status.Settling,
  Transaction.Status.SettlementConfirmed,
  Transaction.Status.SettlementPending,
  Transaction.Status.SubmittedForSettlement,
];

function formatErrors(errors) {
  let formattedErrors = '';

  for (let [, { code, message }] of Object.entries(errors)) {
    formattedErrors += `Error: ${code}: ${message}`;
  }

  return formattedErrors;
}

function createResultObject({ status }) {
  let result;

  if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
    result = {
      header: 'Sweet Success!',
      icon: 'success',
      message:
        'Your test transaction has been successfully processed. See the Braintree API response and try again.',
    };
  } else {
    result = {
      header: 'Transaction Failed',
      icon: 'fail',
      message: `Your test transaction has a status of ${status}. See the Braintree API response and try again.`,
    };
  }

  return result;
}

router.get('/', (req, res) => {
  res.redirect('/checkouts/new');
});

router.get('/checkouts/new', (req, res) => {
  gateway.clientToken.generate({}).then(({ clientToken }) => {
    res.render('checkouts/new', {
      clientToken,
      messages: req.flash('error'),
    });
  });
});

router.get('/checkouts/vault', (req, res) => {
  gateway.clientToken.generate({}).then(({ clientToken }) => {
    res.render('checkouts/vault', {
      clientToken,
      messages: req.flash('error'),
    });
  });
});

router.get('/checkouts/:id', (req, res) => {
  let result;
  const transactionId = req.params.id;

  gateway.transaction.find(transactionId).then((transaction) => {
    result = createResultObject(transaction);
    console.log(JSON.stringify(result));
    res.render('checkouts/show', { transaction, result });
  });
});

router.get('/checkouts/:id/:cid', (req, res) => {
  let result;
  const transactionId = req.params.id;
  const cid = req.params.cid;

  gateway.transaction.find(transactionId).then((transaction) => {
    result = createResultObject(transaction);
    console.log(JSON.stringify(result));
    res.render('checkouts/show', { transaction, result, cid });
  });
});

// Vault
router.post('/vault', (req, res) => {
  // In production you should not take amounts directly from clients
  const { amount, payment_method_nonce: paymentMethodNonce } = req.body;
  // console.log(req.body);
  gateway.transaction
    .sale({
      merchantAccountId: 'test_cad',
      amount,
      paymentMethodNonce,
      options: { storeInVaultOnSuccess: true, submitForSettlement: true },
    })
    .then((result) => {
      console.log('Success');
      const { success, transaction } = result;
      console.log('CID:', JSON.stringify(result.transaction.customer.id));
      return new Promise((resolve, reject) => {
        if (success || transaction) {
          res.redirect(
            `checkouts/${transaction.id}/${result.transaction.customer.id}`
          );
          resolve();
        }

        reject(result);
      });
    })
    .catch(({ errors }) => {
      console.log('errs', errors);
      res.send('Error occured');
    });
});

router.post('/checkouts', (req, res) => {
  // In production you should not take amounts directly from clients
  const { amount, payment_method_nonce: paymentMethodNonce } = req.body;

  gateway.transaction
    .sale({
      merchantAccountId: 'test_cad',
      amount,
      paymentMethodNonce,
      options: { submitForSettlement: false },
    })
    .then((result) => {
      const { success, transaction } = result;

      return new Promise((resolve, reject) => {
        if (success || transaction) {
          res.redirect(`checkouts/${transaction.id}`);

          resolve();
        }

        reject(result);
      });
    })
    .catch(({ errors }) => {
      const deepErrors = errors.deepErrors();

      debug('errors from transaction.sale %O', deepErrors);

      req.flash('error', { msg: formatErrors(deepErrors) });
      res.redirect('checkouts/new');
    });
});

// SETTLE
router.post('/settle', (req, res) => {
  const tid = req.body.tid;
  gateway.transaction.submitForSettlement(`${tid}`, (err, result) => {
    // console.log(result.transaction);
    if (result.success) {
      // console.log(result.transaction.id);
      console.log('settled transaction =', result.transaction);
      res.redirect(`checkouts/${result.transaction.id}`);
    } else {
      console.log(result.errors);
    }
  });
});

// VOID
router.post('/void', (req, res) => {
  const tid = req.body.tid;
  console.log('tid = ', tid);
  gateway.transaction.void(`${tid}`, (err, result) => {
    if (result.success) {
      console.log('voided transaction =', result.transaction);
      res.redirect(`checkouts/${result.transaction.id}`);
    } else {
      console.log('Hit error');
      console.log(result.err);
    }
  });
});

// REFUND
router.post('/refund', (req, res) => {
  // In production you should not take amounts directly from clients
  // console.log('req body', req.body);
  const tid = req.body.tid;
  const amt = req.body.amt;
  gateway.transaction.refund(`${tid}`, `${amt}`, (err, result) => {
    console.log('resilt= ', result);
    if (result.success) {
      console.log('refunded transaction =', result.transaction);
      res.redirect(`checkouts/${result.transaction.id}`);
    } else {
      console.log('error', result.err);
    }
  });
});

// VAULT W/O payment method
router.post('/vault-wopm', (req, res) => {
  gateway.customer.create(
    {
      firstName: req.body.fn,
      lastName: req.body.ln,
      company: req.body.cmp,
      email: req.body.email,
      phone: req.body.phn,
      fax: req.body.fax,
      website: req.body.web,
    },
    (err, result) => {
      if (result.success) {
        console.log('Vault Success');
        res.redirect(`checkouts/new`);
      } else {
        console.log('Error in vault', result.err);
      }
    }
  );
});

// UPDATE VAULT
router.post('/update-vault', (req, res) => {
  console.log(req.body);
  gateway.customer.update(
    req.body.cid,
    {
      email: `${req.body.email}`,
    },
    (err, result) => {
      if (result.success) {
        console.log('Client updated');
        res.redirect(`checkouts/new`);
      } else {
        console.log('Error in vault', result.err);
      }
    }
  );
});

// FIND VAULT
router.post('/find-vault', (req, res) => {
  console.log(req.body);

  gateway.customer.find(req.body.cid, (err, customer) => {
    if (err) {
      console.log('error in finding', err);
      res.send('Customer not found');
    } else {
      res.send(customer);
    }
  });
});

// DELETE VAULT
router.post('/delete-vault', (req, res) => {
  console.log(req.body);

  gateway.customer.delete(req.body.cid, (err) => {
    if (err) {
      console.log('error in finding', err);
    } else {
      res.redirect(`checkouts/new`);
    }
  });
});

module.exports = router;
