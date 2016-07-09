'use strict';

let extensions = [".js", ".html", ".md", ".txt"];
let versionsFilename = "versions.l4idx";

export function isIndexable(filepath) {
  return extensions.indexOf(filepath.slice(filepath.lastIndexOf("."))) >= 0;
}

export function loadIndexJson(filename, options) {
  let path = `https://lively4${options.path}/${filename}`;
  return fetch(path).then(response => {
    if (!response.ok) {
      throw new Error(response);
    } else {
      return response.json();
    }
  });
}

export function saveIndexJson(jsonIndex, filename, options) {
  let path = `https://lively4${options.path}/${filename}`;
  let serialized = JSON.stringify(jsonIndex);
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  return fetch(path, {
    method: "PUT",
    headers: headers,
    body: serialized
  });
}

export function checkIndexFile(filename, options) {
  return new Promise((resolve, reject) => {
    let path = `https://lively4${options.path}/${filename}`;
    fetch(path, {
      method: "OPTIONS"
    }).then(resp => {
      return resp.json();
    }).then(jsonResp => {
      // ugly way to check if file exists (we dont get a 404...)
      if (jsonResp.size === "0 bytes") {
        resolve("unavailable");
      } else {
        resolve("available");
      }
    });
  });
}

export async function saveIndexedVersions(versions, options) {
  let currentVersions = await loadIndexedFileVersions(options.path);
  Object.keys(versions).forEach(indexedPath => {
    currentVersions[indexedPath] = versions[indexedPath];
  });

  // use the save function also for the versions file
  saveIndexJson(currentVersions, versionsFilename, options);
}

function loadIndexedFileVersions(path) {
  return fetch(`https://lively4${path}/${versionsFilename}`).then(resp => {
    return resp.text();
  }).then(resp => {
    let jsonResp = JSON.parse(resp);
    if (jsonResp.error) {
      // looks like versions file does not exist
      return {};
    }

    return jsonResp;
  });
}

async function getFilepaths(options) {
  let indexedVersions = await loadIndexedFileVersions(options.path);
  let proms = [];

  extensions.forEach(query => {
    let fileLimit = 10000;
    let req = `https://api.dropboxapi.com/1/search/auto${options.options.subfolder}?query=${query}&file_limit=${fileLimit}`;

    proms.push(
      fetch(req, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${options.options.token}`,
          "Content-Type": "application/json"
        }
      }).then(resp => { return resp.json(); })
    );
  });

  let filepaths = await Promise.all(proms).then(responses => {
    return responses.reduce((a, b) => {
      return a.concat(b);
    }, []);
  });

  filepaths = filepaths.filter(file => {
    // check if we really have an indexable extension
    return isIndexable(file.path) && (indexedVersions[file.path] !== file.rev);
  }).map(file => {
    // remove the subfolder from the file path
    return {
      path: file.path.slice(options.options.subfolder.length),
      rev: file.rev
    }
  });

  return filepaths.slice(0, 30);
  // return filepaths;
}

export async function* FileReader(filepath, options) {
  let filepaths;
  if (typeof filepath === "object") {
    // no filepath given
    options = filepath;
    filepaths = await getFilepaths(options);
  } else {
    filepaths = [{
      path: filepath
    }];
  }

  for (let i = 0; i < filepaths.length; i++) {
    let path = filepaths[i].path;
    let rev = filepaths[i].rev;
    let content = await fetch(`https://lively4${options.path}${path}`).then(resp => { return resp.text(); });
    yield {
      path: path,
      filename: path.slice(path.lastIndexOf("/") + 1),
      ext: path.slice(path.lastIndexOf(".") + 1),
      rev: rev,
      content: content
    }
  }
}
