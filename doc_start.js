(function(){
	
    function addJss(file){
        var js = document.createElement('script');
        js.src = chrome.runtime.getURL(file);
		
        document.documentElement.appendChild(js);
    }
    function addCss(file,rel){
		if(rel===undefined)rel="stylesheet";
        var css = document.createElement('link');
		if(rel=='icon') css.type="image/png";
        css.rel = rel;
        css.href = chrome.runtime.getURL(file);
        document.documentElement.appendChild(css);
    }
	
	function getTopLevel(domain){
		p = domain.split(".");
		return p[p.length-2]+'.'+p[p.length-1];
	}
	//addJQUERY();
})();