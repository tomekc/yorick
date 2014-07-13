# Yorick

## What's this?
Yorick is ultra-minimalistic, client-side, JavaScript *nanoframework*.
Currently it is 256 lines of code. That's what I mean *nano*.

## Usage

First, you need to include jQuery(ish) library. May it be a genuine jQuery, or any compatible. I use only modern browsers, and Zepto.js worked fine for me.

Look at example `yorick-demo.html`

### Define Controller

Add `data-controller` attribute to any HTML element you wish have in scope:

	<body data-controller="MyController">
	
Then declare controller code:

	var MyController = function($scope, $y) {
		
	
	}
	
### What I can do in Controller?

See `yorick-demo.html` for examples.

#### Bind $scope variables to HTML elements
Any HTML element value with **data-value="name"** attribute is bound to **$scope.name**

#### Bind element visibility to scope variables
Any HTML element value with **data-visible="name"** attribute will be shown/hidden according to **$scope.name** boolean value.


#### Execute functions when form elements change
Add **data-action="funcname"** to any button, select or checkbox. When element is changed (or button clicked), **$scope.funcname()** function is called.	

#### Load fragments
Provided convenience function **$y.loadFragment(selector, path)** will load content of **path** file into element selected by given jQuery **selector**.

#### Use URL hash fragment as key-value store

**$y.hash(key, value)** sets value for given key. 

**$y.hash(key)** to retrieve value of key.

#### Browser safe logging

**$y.log(...)** will log to console if available and when **window.YORICK_DEBUG** is truthy
