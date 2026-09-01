export function deletedResponse(entity: string): { message: string } {
  return { message: `${entity} deleted successfully` };
}