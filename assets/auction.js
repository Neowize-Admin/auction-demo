
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
    new AuctionStepData("ACCEPTING BIDS", 1, "#003764"),
    new AuctionStepData("GOING ONCE", 1.5, "#f3b223"),
    new AuctionStepData("GOING TWICE", 1.75, "#e05491"),
    new AuctionStepData("_", 2, "rgba(0, 0, 0, 0)"),
    new AuctionStepData("NEXT", 1, "rgba(0, 0, 0, 0)"),
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
    new ItemData("Solid Tipped Pique; Polo", "assets/item10.jpg", 29.50),
    new ItemData("Striped Throwback Jersey Polo", "assets/item11.jpg", 34.50),
    new ItemData("BKYN 56 Roses Split-Graphic Crew Sweatshirt", "assets/item12.jpg", 44.50),

];
for (var i = 0; i < items.length; ++i) {
    items[i].index = i;
}

// hold data and state about ongoing auction
function AuctionData(element)
{
    // store the html element holding this auction data (should be jquery set)
    this.element = element;
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
    progressBarSpeedFactor: 0.1,

    // name of the guy currently leading the bet
    leadingBidder: "",

    // data about the product itself
    itemData: null,

    // is this auction done?
    is_done: false,

    // index for the next auction item we'll show
    next_item_index: 0,

    // init auction data (must be called once after everything is created)
    init: function() {
        this.resetAuction();
    },

    // reset auction with a given item
    resetAuction: function(itemData) {

        // if itemData is undefined, pick the item with least usage
        if (!itemData) {
            itemData = items[this.next_item_index++];
            if (this.next_item_index >= items.length) next_item_index = 0;
        }

        // set base params
        this.currBid = 2;
        this.currStep = AuctionSteps.AcceptingBids;
        this.currStepTimeLeft = 100;
        this.bidIncreaseAmount = 2;
        this.leadingBidder = generateName();
        this.is_done = false;

        // update next bids carousel
        var nextItems = this.nextItems;
        var index = itemData.index + 1;
        for (var i = 0; i < nextItems.length; ++i) {

            // get curr 'next-item' div
            var curr = $(nextItems[i]);

            // update image
            var data = items[index++];
            curr.find('img').attr('src', data.img);
        }
        $('#next-items-car')[0].slick.refresh()

        // decide how many bids this auction will get
        this.bidsToEmulate = 1 + Math.round((Math.random() * 5) + (Math.random() * 5));

        // set timeout until next bid
        this.timeForNextBid = Math.random() * 90;

        // show bid button and hide SOLD placeholder
        this.element.find(".bid-button").first().css('opacity', 1);
        this.element.find(".bid-button").last().hide();
        this.element.find('#currently-leading-info').show();

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

        // update item title
        this.element.find(".item-title").text(this.itemData.name);

        // update image
        this.element.find(".lot-image").first().attr('src', this.itemData.img);

        // update winning bid and bidder
        this.element.find("#current-winning-bid").text(this.currBid + '$');
        this.element.find("#current-winning-bidder").text(this.leadingBidder);

        // update original price and discount
        var originPrice = this.element.find(".retail");
        originPrice.text("$" + this.itemData.price);
        var discount = this.element.find(".discount");
        var discountPercent = 100 - Math.round((nextBid / this.itemData.price) * 100);
        discount.text(discountPercent + "% OFF");

        // if its sold status put the sold placeholder button
        if (this.currStep == AuctionSteps.Sold) {
            var bidBtn = this.element.find(".bid-button").first();
            var soldBtn = this.element.find(".bid-button").last();
            soldBtn.show();
            soldBtn.find(".bid-button-title").text("SOLD!");
            soldBtn.find(".bid-button-subtitle").text("$" + this.currBid + " WINNING BID!");
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

    // close the auction immediately
    closeAuction: function() {
        this.currStep = AuctionSteps.Sold;
    },

    // called when a bid is added
    addBid: function(name) {

        // if no name provided generate name
        name = name || generateName();

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

    // init auctions
    auctions.push(new AuctionData(auction1));

    // create divs for next items
    var nextItem = auction1.find(".next-bid-item");
    auctions[0].nextItems = [nextItem];
    for (var i = 0; i < 6; ++i) {
        var curr = nextItem.clone();
        auctions[0].nextItems.push(curr);
        nextItem.after(curr);
    }

    // get bids starting dates
    var startingNextBidsTime = new Date();
    startingNextBidsTime.setHours(startingNextBidsTime.getHours() + 1)
    startingNextBidsTime.setMinutes(0);
    var currTimestamp = startingNextBidsTime.getTime() / 1000;

    // init next items info
    var nextItems = auction1.find(".next-bid-item");
    for (var i = 0; i < nextItems.length; ++i) {

        // get curr 'next-item' div
        var curr = $(nextItems[i]);

        // set item time
        var currTimeObj = new Date(currTimestamp*1000);
        curr.find("p").text("Starting at " + String(currTimeObj).split(' ')[4].slice(0, -3));

        // increase timestamp
        currTimestamp += 60 * 30;
    }

    // init next items carusel
    $('#next-items-car').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        arrows: false,
        autoplaySpeed: 2000,
    });

    // init all auctions
    for (var i = 0; i < auctions.length; ++i) {
        auctions[i].init();
    }

    // show screen after done loading
    $("#loading-black-cover").fadeOut(500);
}
setTimeout(init_auction_widget, 100);


// add bid to a given auction index
function addBid(auctionIndex) {
    auctionIndex = auctionIndex || 0;
    auctions[auctionIndex].addBid("YOU!");
}

// generate a random name
function generateName() {

    // random first name
    var possibleNames = ['Sophia', 'Jackson', 'Emma', 'Aiden', 'Olivia', 'Lucas', 'Ava', 'Liam', 'Mia', 'Noah', 'Isabella', 'Ethan', 'Riley', 'Mason', 'Aria', 'Caden', 'Zoe', 'Oliver', 'Charlotte', 'Elijah', 'Lily', 'Grayson', 'Layla', 'Jacob', 'Amelia', 'Michael', 'Emily', 'Benjamin', 'Madelyn', 'Carter', 'Aubrey', 'James', 'Adalyn', 'Jayden', 'Madison', 'Logan', 'Chloe', 'Alexander'];
    var first = possibleNames[Math.floor(Math.random() * possibleNames.length)];

    // random last name first character
    var possibleLastNameChar = ['A', 'B', 'C', 'D', 'F', 'G', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'V', 'W', 'Y'];
    var last = possibleLastNameChar[Math.floor(Math.random() * possibleLastNameChar.length)];

    // return result
    return first + " " + last + ".";
}

// close current auction
function closeAuction(auctionIndex) {
    auctionIndex = auctionIndex || 0;
    auctions[auctionIndex].closeAuction();
}