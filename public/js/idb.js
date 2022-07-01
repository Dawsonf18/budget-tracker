const { response } = require("express");

// create a variable to hold connection
let db;
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the databse version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    //save a reference to the database
    const db = event.target.result;
    // create an object store (table) called `new_transaction`, set it to auto increment
    db.createObjectStore('new_transaction', { autoIncrement: true});
};

//upon a successful
request.onsuccess = function(event) {
    //when db is successfully created with its object store (from onupgradeneeded event above) or simply establish a connection, save reference to db in global variable
    db = event.target.result;

  // check if app is online, if yes run uploadTransaction() function to send all local db data to api
   if (navigator.online) {
        uploadTransaction();
   }
   if (navigator.offline) {
       saveRecord();
   }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new transaction and there's no internet connection
function saveRecord(record) {
    //open a new transaction with the database with read and write
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store for new transaction
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //add record to your store with add method
    budgetObjectStore.add(record);
};

// function that will handle collecting all of the data 
function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access your object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //get all transactions from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.results),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open one more transaction
                const transaction = db.transaction(['new_ transaction'], 'readwrite');
                //access the  object store
                const budgetObjectStore = transaction.objectStore('new_transaction');
                //clear all items in your store 
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);