# Grantmakers.io Profiles

See also [Grantmakers.io main repo](https://github.com/grantmakers/grantmakers.github.io)

If you have a question, feature request, find a bug, or just want to say hi, please open an [issue on GitHub](https://github.com/grantmakers/grantmakers.github.io/issues).

Assumes Ruby, Node, and npm are installed. Then...

- From project root: `gem install jekyll bundler`
- Create an `ein` folder under `_data`
- Install the `fs` npm package
  * `npm install fs`
- Parse through the aggregated.json file (this will populate the `ein` directory with json files)
  * `cd _data`
  * Rename `aggregated.json.example` to `aggregated.json`
  * `node split_for_jekyll_json`
- From project root:
  * Install Vue / Webpack dependencies: `npm install`
  * Start the server: `npm run dev`
- Site should be accesible here:  `http://localhost:4000/profiles/`

# Credits
- Materialize: [Alvin Wang et al](http://materializecss.com/)
- Electronic Tax Filings: [Amazon Web Services](https://aws.amazon.com/public-datasets/irs-990/)
- PDF Links: [Foundation Center PDF Archives](http://990finder.foundationcenter.org/)
- Images: [Unsplash](https://unsplash.com/)

# License
Copyright 2016, 2017 Chad Kruse, SmarterGiving

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
