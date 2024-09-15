# TO-Do List

## Data structure

### Combine Purchase and Listing into Transaction\*\*

Splitting transactions into the Purchase and Listing tables was originally done because
the data differs slightly - mainly that purchases have prices, and that for purchases
the buyer is the important account, whereas with listings, the seller is the important
account. However, I almost always need to consider Purchases with Listings, and this requires union queries.
