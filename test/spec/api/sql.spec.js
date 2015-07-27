
describe('SQL api client', function() {
  var USER = 'rambo';
  var TEST_DATA = { test: 'good' };
  var sql;
  var ajaxParams;
  var throwError = false;
  var jquery_ajax;
  var ajax;
  beforeEach(function() {
    ajaxParams = null;
    ajax = function(params) {
      ajaxParams = params;
      _.defer(function() {
        if(!throwError && params.success) params.success(TEST_DATA, 200);
        throwError && params.error && params.error({
          responseText: JSON.stringify({
            error: ['jaja']
          })
        });
      });
    }
    sql = new cartodb.SQL({
      user: USER,
      protocol: 'https',
      ajax: ajax
    })

    jquery_ajax = $.ajax;
  });

  afterEach(function() {
    $.ajax = jquery_ajax;
  });

  it("should compile the url if not completeDomain passed", function() {
    expect(sql._host()).toEqual('https://rambo.cartodb.com/api/v2/sql');
  });

  it("should compile the url if completeDomain passed", function() {
    var sqlBis = new cartodb.SQL({
      user: USER,
      protocol: 'https',
      completeDomain: 'http://troloroloro.com'
    })

    expect(sqlBis._host()).toEqual('http://troloroloro.com/api/v2/sql');
  });

  it("should execute a query", function() {
    sql.execute('select * from table');
    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent('select * from table')
    )
    expect(ajaxParams.type).toEqual('get');
    expect(ajaxParams.dataType).toEqual('json');
    expect(ajaxParams.crossDomain).toEqual(true);
  });

  it("should parse template", function() {
    sql.execute('select * from {{table}}', {
      table: 'rambo'
    })
    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent('select * from rambo')
    )
  });

  it("should execute a long query", function() {
    //Generating a giant query
    var long_sql = []
    var i = 2000;
    while (--i) long_sql.push("10000");
    var long_query = 'SELECT * ' + long_sql;

    sql.execute(long_query);

    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.cartodb.com/api/v2/sql'
    )

    expect(ajaxParams.data.q).toEqual(long_query);
    expect(ajaxParams.type).toEqual('post');
    expect(ajaxParams.dataType).toEqual('json');
    expect(ajaxParams.crossDomain).toEqual(true);
  });

  it("should execute a long query with params", function() {
    s = new cartodb.SQL({
      user: 'rambo',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      rambo: 'test',
      ajax: ajax
    })

    //Generating a giant query
    var long_sql = []
    var i = 2000;
    while (--i) long_sql.push("10000");
    var long_query = 'SELECT * ' + long_sql;

    s.execute(long_query, null, {
      dp: 2
    })

    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('rambo.charlies.com')).not.toEqual(-1);
    //Check that we don't have params in the URI
    expect(ajaxParams.url.indexOf('&format=geojson')).toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).toEqual(-1);
    expect(ajaxParams.url.indexOf('&rambo')).toEqual(-1);
    //Check that we have the params in the body
    expect(ajaxParams.data.q).toEqual(long_query);
    expect(ajaxParams.data.format).toEqual('geojson');
    expect(ajaxParams.data.api_key).toEqual('testkey');
    expect(ajaxParams.data.dp).toEqual(2);
    expect(ajaxParams.rambo).toEqual('test');
  });

  it("should substitute mapnik tokens", function() {
    sql.execute('select !pixel_width! as w, !pixel_height! as h, !bbox! as b from {{table}}', {
      table: 't'
    })

    var earth_circumference = 40075017;
    var tile_size = 256;
    var srid = 3857;
    var full_resolution = earth_circumference/tile_size;
    var shift = earth_circumference / 2.0;

    var pw = full_resolution; 
    var ph = pw;
    var bbox = 'ST_MakeEnvelope(' + (-shift) + ',' + (-shift) + ','
                                  + shift + ',' + shift + ',' + srid + ')';

    expect(ajaxParams.url).toEqual(
      'https://' + USER + '.cartodb.com/api/v2/sql?q=' + encodeURIComponent(
        'select ' + pw + ' as w, ' + ph + ' as h, '
        + bbox + ' as b from t')
    )
  });

  it("should call promise", function(done) {
    var data;
    var data_callback;
    
    sql.execute('select * from bla', function(data) { data_callback = data }).done(function(d) {
      data = d;
    });

    setTimeout(function() {
      expect(data).toEqual(TEST_DATA);
      expect(data_callback).toEqual(TEST_DATA);
      done()
    }, 500); //Fix cartodb.js issue #336
  });
  it("should call promise on error", function(done) {
    throwError = true;
    var err = false;
    sql.execute('select * from bla').error(function(d) {
      err = true;
    });
    setTimeout(function() {
      expect(err).toEqual(true);
      done();
    },10);
  });

  it("should include url params", function() {
    s = new cartodb.SQL({
      user: 'rambo',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      rambo: 'test',
      ajax: ajax
    })
    s.execute('select * from rambo', null, {
      dp: 2
    })
    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('rambo.charlies.com')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&format=geojson')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&rambo')).toEqual(-1);
  });

  it("should include extra url params", function() {
    s = new cartodb.SQL({
      user: 'rambo',
      format: 'geojson',
      protocol: 'http',
      host: 'charlies.com',
      api_key: 'testkey',
      rambo: 'test',
      ajax: ajax,
      extra_params: ['rambo']
    })
    s.execute('select * from rambo', null, {
      dp: 2
    })
    expect(ajaxParams.url.indexOf('http://')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('rambo.charlies.com')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&format=geojson')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&api_key=testkey')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&dp=2')).not.toEqual(-1);
    expect(ajaxParams.url.indexOf('&rambo=test')).not.toEqual(-1);

    s.execute('select * from rambo', null, {
      dp: 2,
      rambo: 'test2'
    })
    expect(ajaxParams.url.indexOf('&rambo=test2')).not.toEqual(-1);
  });


  it("should use jsonp if browser does not support cors", function() {
    $.support.cors = false;
    s = new cartodb.SQL({ user: 'jaja', ajax: ajax });
    expect(s.options.jsonp).toEqual(true);
    s.execute('select * from rambo', null, {
      dp: 2,
      jsonpCallback: 'test_callback',
      cache: false
    })
    expect(ajaxParams.dataType).toEqual('jsonp');
    expect(ajaxParams.crossDomain).toEqual(undefined);
    expect(ajaxParams.jsonp).toEqual(undefined);
    expect(ajaxParams.jsonpCallback).toEqual('test_callback');
    expect(ajaxParams.cache).toEqual(false);
    $.support.cors = true;
  });

  it("should get bounds for query", function() {
    var sql = 'SELECT ST_XMin(ST_Extent(the_geom)) as minx,' +
            '       ST_YMin(ST_Extent(the_geom)) as miny,'+
            '       ST_XMax(ST_Extent(the_geom)) as maxx,' +
            '       ST_YMax(ST_Extent(the_geom)) as maxy' +
            ' from (select * from rambo where id=2) as subq';
    s = new cartodb.SQL({ user: 'jaja', ajax: ajax });
    s.getBounds('select * from rambo where id={{id}}', {id: 2});
    expect(ajaxParams.url.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
  });

  it("should get bounds for query with appostrophes", function() {
    s = new cartodb.SQL({ user: 'jaja', ajax: ajax });
    s.getBounds("select * from country where name={{ name }}", { name: "'Spain'"});
    expect(ajaxParams.url.indexOf("%26amp%3B%2339%3B")).toEqual(-1);
  });

});

describe('sql.table', function() {
  var USER = 'rambo';
  var sql;
  beforeEach(function() {
    ajaxParams = null;
    sql = new cartodb.SQL({
      user: USER,
      protocol: 'https'
    })
  });

  it("sql", function() {
    var s = sql.table('test');
    expect(s.sql()).toEqual('select * from test');
    s.columns(['age', 'jeta'])
    expect(s.sql()).toEqual('select age,jeta from test');
    s.filter('age < 10')
    expect(s.sql()).toEqual('select age,jeta from test where age < 10');
    s.limit(15)
    expect(s.sql()).toEqual('select age,jeta from test where age < 10 limit 15');
    s.order_by('age')
    expect(s.sql()).toEqual('select age,jeta from test where age < 10 limit 15 order by age');
  })

});

describe("column descriptions", function(){
  var USER = 'manolo';
  var sql;

  beforeAll(function(){
    this.colDate = new Backbone.Model(JSON.parse('{"name":"object_postedtime","type":"date","geometry_type":"point","bbox":[[-28.92163128242129,-201.09375],[75.84516854027044,196.875]],"analyzed":true,"success":true,"stats":{"type":"date","start_time":"2015-02-19T15:13:16.000Z","end_time":"2015-02-22T04:34:05.000Z","range":220849000,"steps":1024,"null_ratio":0,"column":"object_postedtime"}}'));
    this.colFloat = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"number","geometry_type":"point"}'));
    this.colString = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"string","geometry_type":"point"}'));
    this.colGeom = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"geometry","geometry_type":"point"}'));
    this.colBoolean = new Backbone.Model(JSON.parse('{"name":"asdfd","type":"boolean","geometry_type":"point"}'));
    this.query = "SELECT * FROM whatevs";
    sql = new cartodb.SQL({
      user: USER,
      protocol: 'https'
    });
    sql.execute = function(sql, callback){
      callback({});
    }
  });

  it("should deduct correct describe method", function(){
      spyOn(sql, "describeDate");
      sql.describe(this.query, this.colDate, {type: this.colDate.get("type")}, function(){});
      expect(sql.describeDate).toHaveBeenCalled;

      spyOn(sql, "describeFloat");
      sql.describe(this.query, this.colFloat, {type: this.colFloat.get("type")}, function(){});
      expect(sql.describeFloat).toHaveBeenCalled();

      spyOn(sql, "describeString");
      sql.describe(this.query, this.colString, {type: this.colString.get("type")}, function(){});
      expect(sql.describeString).toHaveBeenCalled();

      spyOn(sql, "describeGeom");
      sql.describe(this.query, this.colGeom, {type: this.colGeom.get("type")}, function(){});
      expect(sql.describeGeom).toHaveBeenCalled();

      spyOn(sql, "describeBoolean");
      sql.describe(this.query, this.colBoolean, {type: this.colBoolean.get("type")}, function(){});
      expect(sql.describeBoolean).toHaveBeenCalled();
  });

  describe("string describer", function(){
    var description;
    beforeAll(function(done){
      sql.execute = function(sql, callback){
        var data = JSON.parse('{"rows":[{"uniq":462,"cnt":487,"null_count":1,"null_ratio":0.002053388090349076,"skew":0.043121149897330596,"array_agg":""}],"time":0.01,"fields":{"uniq":{"type":"number"},"cnt":{"type":"number"},"null_count":{"type":"number"},"null_ratio":{"type":"number"},"skew":{"type":"number"},"array_agg":{"type":"unknown(2287)"}},"total_rows":1}');
        callback(data);
      }
      var callback = function(stuff){
        description = stuff;
        done();
      }
      sql.describeString(sql, this.colString, callback); // THE COLS DON'T MATCH!!!
    });
    
    it("should return a valid histogram", function(){
      expect(description.hist.constructor).toEqual(Array);
    });
    
    it("should return correct type", function(){
      expect(description.type).toEqual("string");
    });
    
    it("should return a null count", function(){
      expect(description.null_count).toEqual("number");
    });
    
    it("should return a distinct count", function(){
      expect(description.distinct).toEqual("number");
    });
    
    it("should return a null ratio", function(){
      expect(description.null_ratio).toEqual("number");
    });
    
    it("should return skew", function(){
      expect(description.skew).toEqual("number");
    });
    
    it("should return weight", function(){
      expect(typeof description.weight).toEqual("number");
    });

    
  })
});
