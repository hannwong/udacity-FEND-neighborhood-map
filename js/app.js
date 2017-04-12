var app = app || {}

app.constructerGuard = function(constructor) {
  if (!(this instanceof constructor)) {
    throw new Error("constructor needs to be called with 'new' keyword");
  }
};

app.AppVM = function() {
  app.constructerGuard.call(this, app.AppVM, "app.AppVM");

  this.firstName = ko.observable("Bert");
  this.lastName = ko.observable("Bertington");
};

ko.applyBindings(app.AppVM());

