
// different auction steps
AuctionSteps = {
    AcceptingBids: 0,
    GoingOnce: 1,
    GoingTwice: 2,
    Sold: 3,
    Next: 4,
}

// metadata on an auction step
function AuctionStepData(text, speed, color) {
    this.text = text;
    this.speed = speed;
    this.color = color;
}

// data about different auction steps
AuctionStepsData = [
    new AuctionStepData("ACCEPTING BIDS", 1, "#4524a0"),
    new AuctionStepData("GOING ONCE", 1.5, "#e4ae07"),
    new AuctionStepData("GOING TWICE", 1.75, "#ce0061"),
    new AuctionStepData("SOLD!", 1.5, "#a7a7a7"),
    new AuctionStepData("NEXT", 1, "white"),
]

// data about an item being sold
function ItemData(name, imgUrl, originalPrice) {

    // is this item currently being used (and by how many sources)
    this.beingUsed = 0;
    this.totalUsed = 0;

    // item properties
    this.name = name;
    this.img = imgUrl;
    this.price = originalPrice;

}

// list of items we can sell
items = [
    new ItemData("Wanderer Cold-Shoulder Graphic T", "assets/item1.jpg", 32.50),
    new ItemData("Chaos America Cold-Shoulder Graphic T", "assets/item2.jpg", 32.50),
    new ItemData("Crushed Velvet Crop Tee", "assets/item3.jpg", 36.50),
    new ItemData("Long Sleeve Keyhole Mock-Neck Top", "assets/item4.jpg", 44.50),
    new ItemData("Long Sleeve Crinkled Cold-Shoulder Top", "assets/item5.jpg", 49.50),
    new ItemData("Long Sleeve Embroidered Peasant Top", "assets/item6.jpg", 49.50),
    new ItemData("Prince & Fox Light Wash Chambray Button Down", "assets/item7.jpg", 54.50),
    new ItemData("Long Sleeve Plaid Woven Shirt", "assets/item8.jpg", 49.50),
    new ItemData("Long Sleeve Plaid Woven Shirt", "assets/item9.jpg", 28.50),

];

// hold data and state about ongoing auction
function AuctionData(element)
{
    // store the html element holding this auction data (should be jquery set)
    this.element = element;

    // reset auction
    this.resetAuction();
}


// auction data prototype
AuctionData.prototype = {

    // current bid amount
    currBid: 0,

    // current bid step (accepting, going once, going twice...)
    currStep: AuctionSteps.AcceptingBids,

    // how much we increase every bid
    bidIncreaseAmount: 2,

    // time left in current step
    currStepTimeLeft: 100,

    // speed factor for decreasing bid time
    progressBarSpeedFactor: 0.25,

    // name of the guy currently leading the bet
    leadingBidder: "",

    // data about the product itself
    itemData: null,

    // is this auction done?
    is_done: false,

    // reset auction with a given item
    resetAuction: function(itemData) {

        // if itemData is undefined, pick the item with least usage
        if (!itemData) {
            var minUsage = 100000;
            for (var i = 0; i < items.length; ++i) {
                var itemUsed = items[i].beingUsed + items[i].totalUsed;
                if (itemUsed < minUsage) {
                    minUsage = itemUsed;
                    itemData = items[i];
                }
            }
        }

        // set base params
        this.currBid = 2;
        this.currStep = AuctionSteps.AcceptingBids;
        this.currStepTimeLeft = 100;
        this.bidIncreaseAmount = 2;
        this.leadingBidder = "";
        this.is_done = false;

        // decide how many bids this auction will get
        this.bidsToEmulate = 1 + Math.round((Math.random() * 5) + (Math.random() * 5));

        // set timeout until next bid
        this.timeForNextBid = Math.random() * 90;

        // show bid button and hide SOLD placeholder
        this.element.find(".bid-button").first().show();
        this.element.find(".bid-button").last().hide();

        // remove reference from prev item
        if (this.itemData) {
            this.itemData.beingUsed--;
        }

        // set default item data
        this.itemData = itemData;
        this.itemData.beingUsed++;
        this.itemData.totalUsed++;

        // add button animation
        this.doButtonHeartbeatEffect();

        // create interval to activate auction main loop
        var _this = this;
        this.interval = setInterval(function() {
            _this.tick();
        }, 1000 / 60);
    },

    // do per-frame event (decrease time etc)
    tick: function() {

        // get bidding data
        var bidData = AuctionStepsData[this.currStep];

        // decrease time
        var bidDecreaseTime = bidData.speed * this.progressBarSpeedFactor;
        this.currStepTimeLeft -= bidDecreaseTime;

        // calc next bid value
        var nextBid = this.currBid + this.bidIncreaseAmount;

        // check if we need to emulate a bid
        if (this.bidsToEmulate > 0) {

            this.timeForNextBid -= bidDecreaseTime;
            if (this.timeForNextBid < 0) {
                this.addBid();
            }
        }

        // update elements

        // update progress bar
        var progressBar = this.element.find(".bid-button-timer-wrapper");
        progressBar.css("background", bidData.color);
        progressBar.css("width", this.currStepTimeLeft + "%");

        // update current bid text
        var bidButton = this.element.find(".bid-button-title").first();
        bidButton.text("BID $" + nextBid);

        // update status
        var statusText = this.element.find(".state");
        statusText.text(bidData.text);
        statusText.css("color", bidData.color);
        statusText.css("font-weight", "bold");

        // update image
        this.element.find(".lot-image").attr('src', this.itemData.img);

        // update original price and discount
        var originPrice = this.element.find(".retail");
        originPrice.text("$" + this.itemData.price);
        var discount = this.element.find(".discount");
        var discountPercent = 100 - Math.round((nextBid / this.itemData.price) * 100);
        discount.text(discountPercent + "% OFF");

        // if its sold status put the sold placeholder button
        if (this.currStep == AuctionSteps.Sold) {
            this.element.find(".bid-button").last().show().find(".bid-button-title").text("SOLD!");
            this.element.find(".bid-button").last().find(".bid-button-subtitle").text("$" + this.currBid + " WINNING BID!");
            this.element.find(".bid-button").first().hide();
            this.bidsToEmulate = 0;
        }

        // if done cancel the tick interval and set the timer to reset auction
        if (this.is_done) {
            var _this = this;
            clearInterval(this.interval);
            this.element.find(".bid-button-title").last().text("NEW BID STARTING");
            this.element.find(".bid-button-subtitle").last().text("Stay tuned..");
            setTimeout(function() {
                _this.resetAuction();
            }, 2000);
        }

        // out of time?
        if (this.currStepTimeLeft <= 0) {
            this.nextStep();
        }
    },

    // called when a bid is added
    addBid: function(name) {

        // reset step
        this.currStep = AuctionSteps.AcceptingBids;
        this.currStepTimeLeft = 100;

        // increase bid
        this.currBid += this.bidIncreaseAmount;

        // random until next bidding
        this.bidsToEmulate--;
        this.timeForNextBid = Math.random() * 175 + (Math.random() * 45 * this.currBid);

        // add button animation
        this.doButtonHeartbeatEffect();

        // set leading bid
        this.leadingBidder = name;
    },

    // add heartbeat effect to the bid button
    doButtonHeartbeatEffect: function() {

        // get button and add heartbeat class
        this.element.find(".bid-button").addClass("heartbeat");

        // remove heartbeat effect after one time
        var _this = this;
        setTimeout(function() {
            _this.element.find(".bid-button").removeClass("heartbeat");
        }, 500);
    },

    // move to next step
    nextStep: function() {

        // increase step
        this.currStep++;
        this.currStepTimeLeft = 100;

        // if done:
        if (this.currStep >= AuctionStepsData.length) {

            // make stuck on "sold" step and mark as done
            this.currStep = AuctionStepsData.length - 1;
            this.is_done = true;
        }

    },
};

// all auctions data
var auctions = [];

// init auctions data
function init_auction_widget()
{
    // create auction divs
    var auction1 = $("#auction-1");
    if (auction1.length === 0) {
        return setTimeout(init_auction_widget, 100);
    }

    // auction 2
    var auction2 = auction1.clone();
    auction2.attr("id", "auction-2")
    auction2.addClass("hidden-sm-down");
    auction1.after(auction2);

    // auction 3
    var auction3 = auction1.clone();
    auction3.attr("id", "auction-3")
    auction3.addClass("hidden-xs-down");
    auction2.after(auction3);

    // init auctions
    auctions.push(new AuctionData(auction1));
    auctions.push(new AuctionData(auction2));
    auctions.push(new AuctionData(auction3));
}
setTimeout(init_auction_widget, 100);