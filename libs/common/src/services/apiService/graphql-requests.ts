export const QUERY_STUFFID_FILES_COUNT = `
  query FilesCount($input: FilesCountServiceInputDto35198QueryInput!) {
    FilesCount(input: $input) {
      data {
        items {
          fileTitle
          fileGuid
        }
        bottomItems {
          fileTitle
          fileGuid
        }
        hasNext
        totalCount
        pageCount
      }
      message
      statusCode
      requestId
      subStatuses {
        subject
        subStatusCode
        message
        subActionType
      }
      mode
    }
  }
`;