import { Incident } from "incident";
import { Uint16, UintSize } from "semantic-types";
import { Movie, NamedId, Tag, TagType } from "swf-tree";
import { ExportAssets } from "swf-tree/tags";
import { isDefinitionTag } from "./definition-tag";
import { getDependencies } from "./dependencies";
import { mapId } from "./map-id";

export function swfMerge(base: Movie, ...extra: Movie[]): Movie {
  const baseMovie: DynMovie = DynMovie.fromAst(base);
  for (const extraAstMovie of extra) {
    const exports: Tag[] | undefined = getExports(extraAstMovie);
    if (exports === undefined) {
      continue;
    }
    const maxCharacterId: Uint16 = baseMovie.getMaxCharacterId();
    const toNewId: (id: Uint16) => Uint16 = (id: Uint16): Uint16 => maxCharacterId + 1 + id;
    const mapped: Tag[] = exports.map(t => mapId(t, toNewId));
    baseMovie.prependRootTags(mapped);
  }
  return baseMovie.getAst();
}

function getExports(astMovie: Movie): Tag[] | undefined {
  const movie: DynMovie = DynMovie.fromAst(astMovie);
  const exported: ReadonlyMap<string, Uint16> = movie.getNamedExports();
  if (exported.size === 0) {
    return undefined;
  }

  const assets: NamedId[] = [];
  for (const [name, id] of exported) {
    assets.push({name, id});
  }
  const exportAssetsTag: ExportAssets = {type: TagType.ExportAssets, assets};

  const definitions: ReadonlyMap<Uint16, UintSize> = movie.getDefinitions();

  const exportedDeepDependencies: Set<Uint16> = new Set();
  for (const exportedId of exported.values()) {
    for (const depId of getDeepDependencies(exportedId, astMovie, definitions)) {
      exportedDeepDependencies.add(depId);
    }
  }

  const openSet: Uint16[] = [...exported.values()].filter(id => !exportedDeepDependencies.has(id));
  const known: Set<Uint16> = new Set(openSet);

  if (openSet.length === 0) {
    throw new Incident("UnableToResolveTopDefinitions");
  }

  const tags: Tag[] = [];
  while (openSet.length > 0) {
    const id: Uint16 = openSet.pop()!;
    const tagIndex: UintSize | undefined = definitions.get(id);
    if (tagIndex === undefined) {
      throw new Incident("UnableToResolveDefinition", {id});
    }
    const tag: Tag = astMovie.tags[tagIndex];
    tags.unshift(tag);
    for (const depId of getDependencies(tag)) {
      if (!known.has(depId)) {
        known.add(depId);
        openSet.unshift(depId);
      }
    }
  }

  tags.push(exportAssetsTag);

  return tags;
}

function getDeepDependencies(
  root: Uint16,
  movie: Movie,
  definitions: ReadonlyMap<Uint16, UintSize>,
): ReadonlySet<Uint16> {
  const openSet: Uint16[] = [root];
  const known: Set<Uint16> = new Set(openSet);
  while (openSet.length > 0) {
    const id: Uint16 = openSet.pop()!;
    const tagIndex: UintSize | undefined = definitions.get(id);
    if (tagIndex === undefined) {
      throw new Incident("UnableToResolveDefinition", {id});
    }
    const tag: Tag = movie.tags[tagIndex];
    for (const depId of getDependencies(tag)) {
      if (!known.has(depId)) {
        known.add(depId);
        openSet.unshift(depId);
      }
    }
  }
  known.delete(root);
  return known;
}

const TOP_TAGS: Set<TagType> = new Set([
  TagType.FileAttributes,
  TagType.Metadata,
  TagType.SetBackgroundColor,
]);

export class DynMovie {
  private astMovie: Movie;
  // From definition id to tag index
  private definitions: Map<Uint16, UintSize> | undefined;
  // From name to id
  private namedExports: Map<string, Uint16> | undefined;
  private maxCharacterId: Uint16 | undefined;

  private constructor(astMovie: Movie) {
    this.astMovie = astMovie;
    this.definitions = undefined;
    this.namedExports = undefined;
    this.maxCharacterId = undefined;
  }

  public static fromAst(astMovie: Movie): DynMovie {
    return new DynMovie(astMovie);
  }

  public prependRootTags(tags: ReadonlyArray<Tag>): void {
    let idx: number = 0;
    for (const [i, tag] of this.astMovie.tags.entries()) {
      if (TOP_TAGS.has(tag.type)) {
        // tslint:disable-next-line:restrict-plus-operands
        idx = i + 1;
      } else {
        break;
      }
    }
    this.astMovie = {
      ...this.astMovie,
      header: this.astMovie.header,
      tags: [...this.astMovie.tags.slice(0, idx), ...tags, ...this.astMovie.tags.slice(idx)],
    };
    this.definitions = undefined;
    this.namedExports = undefined;
    this.maxCharacterId = undefined;
  }

  public getMaxCharacterId(): Uint16 {
    if (this.maxCharacterId === undefined) {
      let maxCharacterId: Uint16 = 0;
      for (const characterId of this.getDefinitions().keys()) {
        maxCharacterId = Math.max(maxCharacterId, characterId);
      }
      this.maxCharacterId = maxCharacterId;
    }
    return this.maxCharacterId;
  }

  public getDefinitions(): ReadonlyMap<Uint16, UintSize> {
    if (this.definitions === undefined) {
      const definitions: Map<Uint16, UintSize> = new Map();

      for (const [tagIndex, tag] of this.astMovie.tags.entries()) {
        if (!isDefinitionTag(tag)) {
          continue;
        }
        const id: Uint16 = tag.id;
        if (definitions.has(id)) {
          throw new Incident("DuplicateDefinitionId", {id});
        }
        definitions.set(id, tagIndex);
      }

      this.definitions = definitions;
    }

    return this.definitions;
  }

  public getNamedExports(): ReadonlyMap<string, Uint16> {
    if (this.namedExports === undefined) {
      const namedExports: Map<string, Uint16> = new Map();

      for (const tag of this.astMovie.tags) {
        if (tag.type !== TagType.ExportAssets) {
          continue;
        }
        for (const {name, id} of tag.assets) {
          if (namedExports.has(name)) {
            console.warn(`DuplicateExportName: ${name} (${id})`);
          }
          namedExports.set(name, id);
        }
      }

      this.namedExports = namedExports;
    }

    return this.namedExports;
  }

  public getAst(): Movie {
    return this.astMovie;
  }
}
