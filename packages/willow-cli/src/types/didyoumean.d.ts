declare module 'didyoumean' {
  function didYouMean(target: string, list: string[]): string | null;
  function didYouMean(target: string, list: string[], key?: string): string | null;
  
  namespace didYouMean {
    function returnFirstMatch(target: string, list: string[]): string | null;
    function returnFirstMatch(target: string, list: string[], key?: string): string | null;
    
    function returnAllMatches(target: string, list: string[]): string[] | null;
    function returnAllMatches(target: string, list: string[], key?: string): string[] | null;
  }
  
  export = didYouMean;
}