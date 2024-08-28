const TEZTOK_ENDPOINT = "https://api.teztok.com/v1/graphql";

/**
 * Query the teztok API
 * @param {string} queryString - GraphQL query string
 * @returns {{success:boolean, error: Error, data: object}}
 *
 */

async function teztokEventRequest(queryString) {
  try {
    let rawResponse = await fetch(TEZTOK_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: queryString,
      }),
    });
    let result = await rawResponse.json();
    return { success: true, error: null, data: result.data.events };
  } catch (error) {
    console.log("Error in teztokQuery", error);
    return { success: false, error: error, data: null };
  }
}

module.exports = teztokEventRequest;
