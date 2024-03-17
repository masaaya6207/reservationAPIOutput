function searchReservations(accessToken, conditions, pagination) {
  const url = "https://api-core.m2msystems.cloud/reservations/search";
  const headers = {
    "Content-Type": "application/json",
    "X-Access-Token": accessToken
  };
  const payload = {
    conditions: conditions,
    pagination: pagination
  };
  const options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload)
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() === 200) {
    const reservationsData = JSON.parse(response.getContentText());
    const reservations = reservationsData.reservations.map(function(reservationData) {
      return {
        id: reservationData.id,
        roomTypeId: reservationData.roomTypeId,
        listingId: reservationData.listingId,
        staySpan: {
          startDate: reservationData.staySpan.startDate,
          endDate: reservationData.staySpan.endDate
        },
        accepted: reservationData.accepted,
        numberOfGuests: reservationData.numberOfGuests,
        price: {
          currencyType: reservationData.price.currencyType,
          rawPrice: reservationData.price.rawPrice
        },
        otaInfo: reservationData.otaInfo,
        pmsType: reservationData.pmsType,
        assignmentStatus: reservationData.assignmentStatus,
        memo: reservationData.memo,
        stayTypeFlag: reservationData.stayTypeFlag,
        totalPrice: {
          currencyType: reservationData.totalPrice.currencyType,
          rawPrice: reservationData.totalPrice.rawPrice
        },
        commissionFee: {
          currencyType: reservationData.commissionFee.currencyType,
          rawPrice: reservationData.commissionFee.rawPrice
        }
      };
    });
    
    return {
      reservations: reservations,
      total: reservationsData.total
    };
  } else {
    console.error("Request failed with status code: " + response.getResponseCode());
    return null;
  }
}

function getAccessToken() {
  const url = "https://api.m2msystems.cloud/login";
  const payload = {
    email: "development+20211103@matsuri-tech.com",
    password: "rYGOOh9PgUxFhjhd"
  };
  const options = {
    method: "post",
    payload: JSON.stringify(payload),
    contentType: "application/json"
  };
  
  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() === 200) {
    const data = JSON.parse(response.getContentText());
    return data.accessToken;
  } else {
    console.error("Failed to get access token. Status code: " + response.getResponseCode());
    return null;
  }
}

function getAllReservations(accessToken, conditions, itemsPerPage) {
  let allReservations = [];
  let currentPage = 0;
  let totalPages = 1;

  while (currentPage < totalPages) {
    const pagination = {
      page: currentPage,
      itemsPerPage: itemsPerPage
    };

    const result = searchReservations(accessToken, conditions, pagination);

    if (result) {
      allReservations = allReservations.concat(result.reservations);
      totalPages = Math.ceil(result.total / itemsPerPage);
    } else {
      break;
    }

    currentPage++;
  }

  return allReservations;
}

function main() {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    console.error("Access token not available. Exiting.");
    return;
  }
  
  const conditions = {
    accepted: false,
    otaType: "AsiaYo",
    listingId: "839ababf-0fe5-4249-b140-67396ab0cdc0"
  };
  const itemsPerPage = 1;
  
  const allReservations = getAllReservations(accessToken, conditions, itemsPerPage);
  
  console.log("allReservations: " + JSON.stringify(allReservations, null, 2));
  console.log("Total reservations: " + allReservations.length);
  console.log("Reservations:");
  allReservations.forEach(function(reservation) {
    console.log("ID: " + reservation.id);
    console.log("Room Type ID: " + reservation.roomTypeId);
    console.log("Listing ID: " + reservation.listingId);
    console.log("Stay Span: " + JSON.stringify(reservation.staySpan));
    console.log("Accepted: " + reservation.accepted);
    console.log("Number of Guests: " + reservation.numberOfGuests);
    console.log("Price: " + JSON.stringify(reservation.price));
    console.log("OTA Info: " + JSON.stringify(reservation.otaInfo));
    console.log("PMS Type: " + reservation.pmsType);
    console.log("Assignment Status: " + reservation.assignmentStatus);
    console.log("Memo: " + reservation.memo);
    console.log("Stay Type Flag: " + reservation.stayTypeFlag);
    console.log("Total Price: " + JSON.stringify(reservation.totalPrice));
    console.log("Commission Fee: " + JSON.stringify(reservation.commissionFee));
    console.log("---");
  });
} 