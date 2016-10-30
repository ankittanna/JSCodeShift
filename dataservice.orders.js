define(['amplify', 'jquery', 'config', 'amplify.request.deferred'], function (amplify, $, config) {

    'use strict';

    amplify.request.define('getOrders', 'ajax', {
        dataType: 'jsonp',
        url: config.urls.getOrdersUrl
    });

    function getOrders(partyId, accountNumber) {
        if (!partyId || !accountNumber) {
            throw new Error('partyId and accountNumber are required');
        }

        return amplify.request('getOrders', {
            partyId: partyId,
            accountNumber: accountNumber
        });
    }

    function modifyRenumber(payload) {
        if (!payload) {
            throw new Error('payload is required');
        }

        return $.ajax({
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            data: JSON.stringify(payload),
            url: config.urls.modifyRenumberURL
        });
    }

    function modifyDirectory(payload) {
        if (!payload) {
            throw new Error('payload is required');
        }

        return $.ajax({
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            data: JSON.stringify(payload),
            url: config.urls.modifyDirectoryURL
        });
    }

    return {
        getOrders: getOrders,
        modifyRenumber: modifyRenumber,
        modifyDirectory: modifyDirectory
    };

});
